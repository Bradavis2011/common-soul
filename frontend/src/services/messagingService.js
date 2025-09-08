const { PrismaClient } = require('@prisma/client');

class MessagingService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Get or create conversation between customer and healer
  async getOrCreateConversation(customerId, healerId, bookingId = null) {
    try {
      // First try to find existing conversation
      let conversation = await this.prisma.conversation.findUnique({
        where: {
          customerId_healerId: {
            customerId,
            healerId
          }
        },
        include: {
          customer: {
            include: { profile: true }
          },
          healer: {
            include: { profile: true }
          },
          booking: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      // If no conversation exists, create one
      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            customerId,
            healerId,
            bookingId,
            isActive: true
          },
          include: {
            customer: {
              include: { profile: true }
            },
            healer: {
              include: { profile: true }
            },
            booking: true,
            messages: true
          }
        });
      }

      return conversation;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw new Error('Failed to get or create conversation');
    }
  }

  // Send message in conversation
  async sendMessage(conversationId, senderId, content, messageType = 'TEXT', attachmentUrl = null) {
    try {
      // Verify conversation exists and user is participant
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.customerId !== senderId && conversation.healerId !== senderId) {
        throw new Error('Unauthorized to send message in this conversation');
      }

      // Create message
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          messageType,
          attachmentUrl,
          isRead: false
        },
        include: {
          sender: {
            include: { profile: true }
          }
        }
      });

      // Update conversation's last message timestamp
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a conversation with pagination
  async getMessages(conversationId, userId, page = 1, limit = 50) {
    try {
      // Verify user has access to this conversation
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.customerId !== userId && conversation.healerId !== userId) {
        throw new Error('Unauthorized to view this conversation');
      }

      const skip = (page - 1) * limit;

      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            include: { profile: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const totalMessages = await this.prisma.message.count({
        where: { conversationId }
      });

      return {
        messages: messages.reverse(), // Return in chronological order
        totalMessages,
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        hasNextPage: skip + limit < totalMessages
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // Get user's conversations
  async getUserConversations(userId) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { customerId: userId },
            { healerId: userId }
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
                  senderId: { not: userId }
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return conversations.map(conversation => ({
        ...conversation,
        unreadCount: conversation._count.messages,
        lastMessage: conversation.messages[0] || null
      }));
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get conversations');
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    try {
      // Verify user has access to this conversation
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.customerId !== userId && conversation.healerId !== userId) {
        throw new Error('Unauthorized');
      }

      // Mark all unread messages from other users as read
      const updatedMessages = await this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return updatedMessages.count;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Delete conversation (soft delete)
  async deleteConversation(conversationId, userId) {
    try {
      // Verify user has access to this conversation
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.customerId !== userId && conversation.healerId !== userId) {
        throw new Error('Unauthorized');
      }

      // Soft delete by marking as inactive
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Search conversations
  async searchConversations(userId, query) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { customerId: userId },
            { healerId: userId }
          ],
          isActive: true,
          OR: [
            {
              customer: {
                profile: {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } }
                  ]
                }
              }
            },
            {
              healer: {
                profile: {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } }
                  ]
                }
              }
            }
          ]
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
            take: 1
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return conversations;
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw new Error('Failed to search conversations');
    }
  }

  // Send system message (for booking updates, etc.)
  async sendSystemMessage(conversationId, content, messageType = 'SYSTEM') {
    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId: 'system', // Special sender ID for system messages
          content,
          messageType,
          isRead: false
        }
      });

      // Update conversation's last message timestamp
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return message;
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  }

  // Get conversation statistics
  async getConversationStats(conversationId, userId) {
    try {
      // Verify user has access
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.customerId !== userId && conversation.healerId !== userId) {
        throw new Error('Unauthorized');
      }

      const stats = await this.prisma.message.aggregate({
        where: { conversationId },
        _count: {
          id: true
        }
      });

      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false
        }
      });

      return {
        totalMessages: stats._count.id,
        unreadMessages: unreadCount,
        conversationStarted: conversation.createdAt,
        lastActivity: conversation.lastMessageAt
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      throw error;
    }
  }
}

module.exports = new MessagingService();