import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import ConversationList from '../components/messaging/ConversationList'
import ChatWindow from '../components/messaging/ChatWindow'
import { 
  ChatBubbleLeftRightIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline'

function Messages() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (socket) {
      // Listen for new conversations
      socket.on('conversation_created', handleConversationCreated)
      socket.on('new_message', handleNewMessage)
      
      return () => {
        socket.off('conversation_created')
        socket.off('new_message')
      }
    }
  }, [socket])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messaging/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Fetch conversations error:', error)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleConversationCreated = (conversation) => {
    setConversations(prev => [conversation, ...prev])
  }

  const handleNewMessage = (message) => {
    // Update conversation list with new message
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: conv.unreadCount + (message.senderId !== user.id ? 1 : 0)
          }
        }
        return conv
      })
    )

    // Move conversation to top
    setConversations(prev => {
      const updated = [...prev]
      const convIndex = updated.findIndex(c => c.id === message.conversationId)
      if (convIndex > 0) {
        const [conversation] = updated.splice(convIndex, 1)
        updated.unshift(conversation)
      }
      return updated
    })
  }

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    
    // Mark conversation as read
    if (conversation.unreadCount > 0) {
      markConversationAsRead(conversation.id)
    }
  }

  const markConversationAsRead = async (conversationId) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_URL}/messaging/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      )
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  const handleStartNewConversation = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId })
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()
      const newConversation = {
        id: data.conversation.id,
        otherUser: data.conversation.customer.id === user.id 
          ? data.conversation.healer 
          : data.conversation.customer,
        lastMessage: null,
        unreadCount: 0,
        booking: data.conversation.booking,
        lastMessageAt: data.conversation.createdAt,
        createdAt: data.conversation.createdAt
      }

      setConversations(prev => [newConversation, ...prev])
      setSelectedConversation(newConversation)
    } catch (error) {
      console.error('Start conversation error:', error)
      alert('Failed to start conversation')
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-600">Please log in to access your messages.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-200px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p className="text-gray-600">
            {isConnected ? 'Connected - messages will update in real-time' : 'Connecting...'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchConversations}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <button
                  onClick={() => {
                    // TODO: Open new conversation modal
                    alert('New conversation feature coming soon!')
                  }}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                  title="Start new conversation"
                >
                  <UserPlusIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-500 text-sm">
                      Start a conversation by messaging a healer from their profile
                    </p>
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={handleSelectConversation}
                    currentUserId={user.id}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                currentUserId={user.id}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages