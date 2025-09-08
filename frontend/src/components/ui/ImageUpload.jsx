import { useState, useRef } from 'react'
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'

function ImageUpload({ 
  onUpload, 
  currentImage = null, 
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
  placeholder = "Upload an image",
  variant = "default" // "default", "avatar", "banner"
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF and WebP images are allowed')
    }
  }

  const handleFileSelect = async (file) => {
    try {
      setError('')
      setUploading(true)

      validateFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target.result)
      reader.readAsDataURL(file)

      // Create FormData and upload
      const formData = new FormData()
      formData.append(getFieldName(), file)

      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/${getEndpoint()}`, {
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
      onUpload(data)
      
    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message)
      setPreviewUrl(currentImage) // Reset preview on error
    } finally {
      setUploading(false)
    }
  }

  const getFieldName = () => {
    switch (variant) {
      case 'avatar': return 'avatar'
      case 'service': return 'image'
      default: return 'image'
    }
  }

  const getEndpoint = () => {
    switch (variant) {
      case 'avatar': return 'avatar'
      case 'service': return 'service-image'
      case 'healer': return 'healer-profile'
      default: return 'service-image'
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onUpload({ imageUrl: null, avatarUrl: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const renderContent = () => {
    if (variant === 'avatar') {
      return (
        <div className="relative">
          <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 ${dragOver ? 'border-indigo-500 bg-indigo-50' : ''}`}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {previewUrl && !uploading && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragOver 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-48 mx-auto rounded-lg"
            />
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">{placeholder}</p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
      >
        {renderContent()}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {uploading && (
        <p className="mt-2 text-sm text-indigo-600">Uploading...</p>
      )}
    </div>
  )
}

export default ImageUpload