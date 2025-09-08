const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class SocketService {
  constructor() {
    this.io = null
    this.userSockets = new Map() // userId -> socket.id
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    })

    this.io.use(this.authenticate)
    this.io.on('connection', this.handleConnection.bind(this))
    
    console.log('Socket.IO server initialized')
    return this.io
  }

  authenticate = async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true
        }
      })

      if (!user) {
        return next(new Error('Invalid token'))
      }

      socket.userId = user.id
      socket.user = user
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  }

  handleConnection = (socket) => {
    console.log(`User ${socket.user.email} connected (${socket.id})`)
    
    // Store user socket mapping
    this.userSockets.set(socket.userId, socket.id)
    
    // Join user to their personal room
    socket.join(`user:${socket.userId}`)

    // Join conversation rooms
    this.joinUserConversations(socket)

    // Handle events
    socket.on('send_message', this.handleSendMessage.bind(this, socket))
    socket.on('join_conversation', this.handleJoinConversation.bind(this, socket))
    socket.on('mark_as_read', this.handleMarkAsRead.bind(this, socket))
    socket.on('typing_start', this.handleTypingStart.bind(this, socket))
    socket.on('typing_stop', this.handleTypingStop.bind(this, socket))
    
    socket.on('disconnect', this.handleDisconnect.bind(this, socket))
  }

  joinUserConversations = async (socket) => {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { customerId: socket.userId },
            { healerId: socket.userId }
          ],
          isActive: true
        }
      })

      conversations.forEach(conv => {
        socket.join(`conversation:${conv.id}`)
      })
    } catch (error) {
      console.error('Error joining conversations:', error)
    }
  }

  handleSendMessage = async (socket, data) => {
    try {
      const { conversationId, content, messageType = 'TEXT' } = data

      // Verify user is part of this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { customerId: socket.userId },
            { healerId: socket.userId }
          ]
        },
        include: {
          customer: { include: { profile: true } },
          healer: { include: { profile: true } }
        }
      })

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' })
        return
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userId,
          content,
          messageType
        },
        include: {
          sender: {
            include: {
              profile: true
            }
          }
        }
      })

      // Update conversation last message time
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })

      // Emit to conversation room
      this.io.to(`conversation:${conversationId}`).emit('new_message', {
        ...message,
        conversationId
      })

      // Send push notification to other user
      const otherUserId = conversation.customerId === socket.userId 
        ? conversation.healerId 
        : conversation.customerId
      
      this.sendNotification(otherUserId, {
        type: 'new_message',
        title: 'New Message',
        body: `${socket.user.profile?.firstName} sent you a message`,
        data: { conversationId, messageId: message.id }
      })

    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  }

  handleJoinConversation = async (socket, data) => {
    const { conversationId } = data
    
    // Verify user can join this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: socket.userId },
          { healerId: socket.userId }
        ]
      }
    })

    if (conversation) {
      socket.join(`conversation:${conversationId}`)
      socket.emit('joined_conversation', { conversationId })
    } else {
      socket.emit('error', { message: 'Cannot join conversation' })
    }
  }

  handleMarkAsRead = async (socket, data) => {
    try {
      const { messageIds } = data

      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          NOT: { senderId: socket.userId } // Don't mark own messages as read
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      // Notify sender that messages were read
      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        include: { conversation: true }
      })

      messages.forEach(message => {
        if (message.senderId !== socket.userId) {
          this.sendToUser(message.senderId, 'messages_read', {
            messageIds: [message.id],
            conversationId: message.conversationId,
            readBy: socket.userId
          })
        }
      })

    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  handleTypingStart = (socket, data) => {
    const { conversationId } = data
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    })
  }

  handleTypingStop = (socket, data) => {
    const { conversationId } = data
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    })
  }

  handleDisconnect = (socket) => {
    console.log(`User ${socket.user.email} disconnected`)
    this.userSockets.delete(socket.userId)
  }

  // Helper methods
  sendToUser = (userId, event, data) => {
    const socketId = this.userSockets.get(userId)
    if (socketId) {
      this.io.to(socketId).emit(event, data)
    }
  }

  sendNotification = (userId, notification) => {
    this.sendToUser(userId, 'notification', notification)
  }

  createConversation = async (customerId, healerId, bookingId = null) => {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          customerId,
          healerId,
          bookingId
        },
        include: {
          customer: { include: { profile: true } },
          healer: { include: { profile: true } }
        }
      })

      // Notify both users
      this.sendToUser(customerId, 'conversation_created', conversation)
      this.sendToUser(healerId, 'conversation_created', conversation)

      return conversation
    } catch (error) {
      console.error('Create conversation error:', error)
      throw error
    }
  }
}

module.exports = new SocketService()