import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../../context/SocketContext'
import { 
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

function ChatWindow({ conversation, currentUserId }) {
  const { socket, sendMessage, joinConversation, markAsRead, startTyping, stopTyping } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const otherUser = conversation.otherUser

  useEffect(() => {
    if (conversation.id) {
      fetchMessages()
      joinConversation(conversation.id)
    }
  }, [conversation.id])

  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage)
      socket.on('user_typing', handleUserTyping)
      socket.on('messages_read', handleMessagesRead)

      return () => {
        socket.off('new_message')
        socket.off('user_typing')
        socket.off('messages_read')
      }
    }
  }, [socket, conversation.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations/${conversation.id}/messages`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])

      // Mark messages as read
      const unreadMessages = data.messages
        .filter(msg => !msg.isRead && msg.senderId !== currentUserId)
        .map(msg => msg.id)
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages)
      }
    } catch (error) {
      console.error('Fetch messages error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message) => {
    if (message.conversationId === conversation.id) {
      setMessages(prev => [...prev, message])
      
      // Mark as read if not from current user
      if (message.senderId !== currentUserId) {
        markAsRead([message.id])
      }
    }
  }

  const handleUserTyping = ({ userId, isTyping }) => {
    if (userId !== currentUserId) {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        if (isTyping) {
          newSet.add(userId)
        } else {
          newSet.delete(userId)
        }
        return newSet
      })
    }
  }

  const handleMessagesRead = ({ messageIds, readBy }) => {
    if (readBy !== currentUserId) {
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg.id) ? { ...msg, isRead: true, readAt: new Date() } : msg
        )
      )
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    sendMessage(conversation.id, newMessage.trim())
    setNewMessage('')
    stopTyping(conversation.id)
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    
    // Handle typing indicators
    startTyping(conversation.id)
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversation.id)
    }, 2000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.createdAt).toDateString()
    const previousDate = new Date(previousMessage.createdAt).toDateString()
    
    return currentDate !== previousDate
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {otherUser.profile?.avatarUrl ? (
              <img 
                src={otherUser.profile.avatarUrl} 
                alt={`${otherUser.profile.firstName} ${otherUser.profile.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-400">
                {otherUser.profile?.firstName?.[0]}{otherUser.profile?.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherUser.profile?.firstName} {otherUser.profile?.lastName}
            </h3>
            {conversation.booking && (
              <p className="text-xs text-gray-500">
                📅 {conversation.booking.service?.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Voice call"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Video call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="More options"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <p className="text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId
              const previousMessage = index > 0 ? messages[index - 1] : null
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage)

              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwn 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        isOwn ? 'text-indigo-200' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{formatTime(message.createdAt)}</span>
                        {isOwn && (
                          <span className="text-xs">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow