import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  MicrophoneIcon as MicrophoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
  SpeakerWaveIcon as SpeakerWaveIconSolid
} from '@heroicons/react/24/solid'

function VideoCall({ roomUrl, onLeave, booking = null }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [participants, setParticipants] = useState([])
  
  // Call controls
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  // Refs
  const jitsiApiRef = useRef(null)
  const videoContainerRef = useRef(null)

  useEffect(() => {
    initializeVideoCall()
    
    return () => {
      // Cleanup
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
      }
    }
  }, [roomUrl])

  const initializeVideoCall = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Load Jitsi Meet API if not already loaded
      if (!window.JitsiMeetExternalAPI) {
        await loadJitsiScript()
      }

      // Extract room name from URL or generate one
      const roomName = extractRoomName(roomUrl)
      const displayName = `${user?.profile?.firstName} ${user?.profile?.lastName}` || user?.email

      // Configure Jitsi Meet options
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: videoContainerRef.current,
        userInfo: {
          displayName: displayName,
          email: user?.email
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'chat', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'settings', 'videoquality'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#1f2937'
        }
      }

      // Create Jitsi API instance
      const api = new window.JitsiMeetExternalAPI('meet.jit.si', options)
      jitsiApiRef.current = api

      // Set up event listeners
      api.addEventListener('videoConferenceJoined', handleJoinedMeeting)
      api.addEventListener('videoConferenceLeft', handleLeftMeeting)
      api.addEventListener('participantJoined', handleParticipantJoined)
      api.addEventListener('participantLeft', handleParticipantLeft)
      api.addEventListener('readyToClose', handleLeftMeeting)

      setConnectionStatus('connected')

    } catch (error) {
      console.error('Video call initialization error:', error)
      setError('Failed to initialize video call. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="external_api"]')) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const extractRoomName = (url) => {
    if (!url) {
      // Generate a room name based on booking ID or user info
      return `common-soul-${booking?.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // If it's already a room name, return it
    if (!url.includes('://')) {
      return url
    }
    
    // Extract room name from URL
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.split('/').pop() || `room-${Date.now()}`
    } catch {
      return `room-${Date.now()}`
    }
  }

  // Event handlers
  const handleJoinedMeeting = (event) => {
    setIsJoined(true)
    setConnectionStatus('connected')
    console.log('Joined meeting:', event)
  }

  const handleLeftMeeting = () => {
    setIsJoined(false)
    setConnectionStatus('disconnected')
    onLeave()
  }

  const handleParticipantJoined = (event) => {
    console.log('Participant joined:', event)
    setParticipants(prev => [...prev, event.id])
  }

  const handleParticipantLeft = (event) => {
    console.log('Participant left:', event)
    setParticipants(prev => prev.filter(id => id !== event.id))
  }

  // Control functions
  const toggleMute = () => {
    if (jitsiApiRef.current) {
      const newMutedState = !isMuted
      if (newMutedState) {
        jitsiApiRef.current.executeCommand('toggleAudio')
      } else {
        jitsiApiRef.current.executeCommand('toggleAudio')
      }
      setIsMuted(newMutedState)
    }
  }

  const toggleCamera = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo')
      setIsCameraOff(!isCameraOff)
    }
  }

  const toggleSpeaker = () => {
    // Jitsi handles speaker control internally
    setIsSpeakerOn(!isSpeakerOn)
  }

  const leaveCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup')
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting': return 'text-yellow-500'
      case 'connected': return 'text-green-500'
      case 'disconnected': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting...'
      case 'connected': return 'Connected'
      case 'disconnected': return 'Disconnected'
      default: return 'Unknown'
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200 p-8">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Video Call Error</h3>
        <p className="text-red-700 text-center mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={initializeVideoCall}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
          <button
            onClick={onLeave}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
          >
            Leave Call
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor().replace('text-', 'bg-')}`} />
          <span className="text-white text-sm">{getConnectionStatusText()}</span>
          {booking && (
            <span className="text-gray-300 text-sm">
              • {booking.service?.title} with {booking.healer?.profile?.firstName}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-300 text-sm">
            <UserGroupIcon className="h-4 w-4" />
            {participants.length + 1}
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
            title="Toggle Chat"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white">Connecting to video call...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={videoContainerRef} 
          className="w-full h-full bg-gray-800"
        />

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-3 bg-gray-800 bg-opacity-90 rounded-full px-4 py-3">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicrophoneIconSolid className="h-5 w-5" />
              ) : (
                <MicrophoneIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-colors ${
                isCameraOff 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? (
                <VideoCameraIconSolid className="h-5 w-5" />
              ) : (
                <VideoCameraIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={toggleSpeaker}
              className={`p-3 rounded-full transition-colors ${
                isSpeakerOn 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
            >
              {isSpeakerOn ? (
                <SpeakerWaveIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIconSolid className="h-5 w-5" />
              )}
            </button>

            <div className="w-px h-8 bg-gray-600" />

            <button
              onClick={leaveCall}
              className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Leave Call"
            >
              <PhoneXMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Session Info */}
      {booking && (
        <div className="bg-gray-800 p-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              Session Duration: {booking.duration} minutes
            </span>
            <span className="text-gray-300">
              Started: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoCall