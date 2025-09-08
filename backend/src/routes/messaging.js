const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')
const socketService = require('../services/socketService')

const router = express.Router()
const prisma = new PrismaClient()

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { customerId: req.user.id },
          { healerId: req.user.id }
        ],
        isActive: true
      },
      include: {
        customer: {
          include: { profile: true }
        },
        healer: {
          include: { profile: true }
        },
        booking: {
          include: { service: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              include: { profile: true }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                NOT: { senderId: req.user.id }
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Format response
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      otherUser: conv.customerId === req.user.id ? conv.healer : conv.customer,
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
      booking: conv.booking,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt
    }))

    res.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// Get conversation messages
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: req.user.id },
          { healerId: req.user.id }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    })

    res.json({ 
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === parseInt(limit)
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Create or get conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { otherUserId, bookingId } = req.body

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' })
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { customerId: req.user.id, healerId: otherUserId },
          { customerId: otherUserId, healerId: req.user.id }
        ]
      },
      include: {
        customer: { include: { profile: true } },
        healer: { include: { profile: true } },
        booking: { include: { service: true } }
      }
    })

    if (!conversation) {
      // Determine customer and healer roles
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        include: { profile: true }
      })

      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      const isCurrentUserCustomer = req.user.userType === 'CUSTOMER'
      
      conversation = await prisma.conversation.create({
        data: {
          customerId: isCurrentUserCustomer ? req.user.id : otherUserId,
          healerId: isCurrentUserCustomer ? otherUserId : req.user.id,
          bookingId: bookingId || null
        },
        include: {
          customer: { include: { profile: true } },
          healer: { include: { profile: true } },
          booking: { include: { service: true } }
        }
      })

      // Notify via socket
      socketService.sendToUser(otherUserId, 'conversation_created', conversation)
    }

    res.json({ conversation })
  } catch (error) {
    console.error('Create conversation error:', error)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// Send message (REST endpoint for fallback)
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { content, messageType = 'TEXT' } = req.body

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: req.user.id },
          { healerId: req.user.id }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.id,
        content,
        messageType
      },
      include: {
        sender: {
          include: { profile: true }
        }
      }
    })

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    })

    res.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Mark messages as read
router.patch('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params

    await prisma.message.updateMany({
      where: {
        conversationId,
        isRead: false,
        NOT: { senderId: req.user.id }
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
})

// Delete conversation
router.delete('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: req.user.id },
          { healerId: req.user.id }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Soft delete - mark as inactive
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isActive: false }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

module.exports = router