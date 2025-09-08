import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (user && token) {
      // Create socket connection
      const newSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
        auth: { token },
        transports: ['websocket', 'polling'],
        upgrade: true,
      })

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to server:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })

      // User status events
      newSocket.on('user_online', (userId) => {
        setOnlineUsers(prev => new Set([...prev, userId]))
      })

      newSocket.on('user_offline', (userId) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      })

      setSocket(newSocket)

      return () => {
        console.log('Cleaning up socket connection')
        newSocket.close()
      }
    }
  }, [user, token])

  // Helper functions
  const sendMessage = (conversationId, content, messageType = 'TEXT') => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        conversationId,
        content,
        messageType
      })
    }
  }

  const joinConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId })
    }
  }

  const markAsRead = (messageIds) => {
    if (socket && isConnected && messageIds.length > 0) {
      socket.emit('mark_as_read', { messageIds })
    }
  }

  const startTyping = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId })
    }
  }

  const stopTyping = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId })
    }
  }

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId)
  }

  const value = {
    socket,
    isConnected,
    onlineUsers,
    sendMessage,
    joinConversation,
    markAsRead,
    startTyping,
    stopTyping,
    isUserOnline
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContext