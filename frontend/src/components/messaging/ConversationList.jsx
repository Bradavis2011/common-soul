import { useSocket } from '../../context/SocketContext'

function ConversationList({ conversations, selectedConversation, onSelectConversation, currentUserId }) {
  const { isUserOnline } = useSocket()

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet'
    
    const isOwn = message.senderId === currentUserId
    const prefix = isOwn ? 'You: ' : ''
    
    if (message.messageType === 'TEXT') {
      const content = message.content.length > 50 
        ? message.content.substring(0, 50) + '...' 
        : message.content
      return `${prefix}${content}`
    }
    
    return `${prefix}Sent an attachment`
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return minutes < 1 ? 'Just now' : `${minutes}m ago`
    }
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    }
    
    if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24)
      return `${days}d ago`
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map(conversation => {
        const otherUser = conversation.otherUser
        const isSelected = selectedConversation?.id === conversation.id
        const isOnline = isUserOnline(otherUser.id)
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
              isSelected ? 'bg-indigo-50 border-indigo-200' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {otherUser.profile?.avatarUrl ? (
                    <img 
                      src={otherUser.profile.avatarUrl} 
                      alt={`${otherUser.profile.firstName} ${otherUser.profile.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-400">
                      {otherUser.profile?.firstName?.[0]}{otherUser.profile?.lastName?.[0]}
                    </span>
                  )}
                </div>
                {/* Online indicator */}
                {isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {otherUser.profile?.firstName} {otherUser.profile?.lastName}
                  </h3>
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  )}
                </div>

                {/* Last message */}
                <p className="text-sm text-gray-600 truncate mb-1">
                  {formatLastMessage(conversation.lastMessage)}
                </p>

                {/* Booking context */}
                {conversation.booking && (
                  <p className="text-xs text-indigo-600 truncate">
                    📅 {conversation.booking.service?.title}
                  </p>
                )}

                {/* Unread count */}
                {conversation.unreadCount > 0 && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {conversation.unreadCount} new
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ConversationList