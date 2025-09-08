const { v2: cloudinary } = require('cloudinary')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Custom Cloudinary storage handler
const cloudinaryStorage = {
  _handleFile: (req, file, cb) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'common-soul',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          cb(error)
        } else {
          cb(null, {
            path: result.secure_url,
            public_id: result.public_id,
            filename: result.public_id
          })
        }
      }
    )
    file.stream.pipe(uploadStream)
  },
  _removeFile: (req, file, cb) => {
    cloudinary.uploader.destroy(file.public_id, cb)
  }
}

// Fallback to local storage if Cloudinary is not configured
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false)
  }
}

// Create multer upload middleware
const createUploadMiddleware = (fieldName = 'file', options = {}) => {
  const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET

  const upload = multer({
    storage: useCloudinary ? cloudinaryStorage : localStorage,
    fileFilter,
    limits: {
      fileSize: options.maxSize || 5 * 1024 * 1024, // 5MB default
      files: options.maxFiles || 1
    }
  })

  if (options.multiple) {
    return upload.array(fieldName, options.maxFiles)
  } else {
    return upload.single(fieldName)
  }
}

// Upload single file
const uploadSingle = (fieldName = 'file', options = {}) => {
  return createUploadMiddleware(fieldName, { ...options, multiple: false })
}

// Upload multiple files
const uploadMultiple = (fieldName = 'files', options = {}) => {
  return createUploadMiddleware(fieldName, { ...options, multiple: true })
}

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.destroy(publicId)
      return result
    }
    return { result: 'ok' } // For local files, we'd need filesystem deletion
  } catch (error) {
    console.error('Delete file error:', error)
    throw error
  }
}

// Get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `/uploads/${publicId}` // Local file path
  }

  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto:good'
  } = options

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: 'auto'
  })
}

// Generate thumbnail
const generateThumbnail = (publicId, size = 200) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `/uploads/${publicId}` // Local file path
  }

  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  })
}

// Validate image dimensions
const validateImageDimensions = async (file) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        valid: img.width >= 100 && img.height >= 100 // Minimum 100x100
      })
    }
    img.onerror = () => {
      resolve({ valid: false })
    }
    img.src = file.path || file.secure_url
  })
}

module.exports = {
  cloudinary,
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getOptimizedUrl,
  generateThumbnail,
  validateImageDimensions
}