import { useState } from 'react'

function AvatarUpload({ currentAvatarUrl, onAvatarUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select an image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadFile(file)
  }

  const uploadFile = async (file) => {
    setUploading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      const fullAvatarUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${data.avatarUrl}`
      
      // Call parent callback with new avatar URL
      if (onAvatarUpdate) {
        onAvatarUpdate(fullAvatarUrl)
      }

      setPreview(null)
    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to upload avatar')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displayAvatar = preview || currentAvatarUrl

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {displayAvatar ? (
            <img 
              src={displayAvatar} 
              alt="Profile Avatar" 
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-400">?</span>
          )}
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="text-center">
        <label 
          htmlFor="avatar-upload" 
          className={`inline-block px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
            uploading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Help Text */}
      <div className="text-gray-500 text-xs text-center max-w-xs">
        Upload a photo (JPEG, PNG, GIF, WebP). Max size: 5MB.
      </div>
    </div>
  )
}

export default AvatarUpload