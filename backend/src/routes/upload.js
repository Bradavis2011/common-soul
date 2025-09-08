const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')
const { uploadSingle, uploadMultiple, deleteFile, getOptimizedUrl } = require('../services/uploadService')

const router = express.Router()
const prisma = new PrismaClient()

// Upload avatar
router.post('/avatar', authenticateToken, uploadSingle('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const avatarUrl = req.file.path || `/uploads/${req.file.filename}`

    // Update user profile with new avatar URL
    await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: { avatarUrl }
    })

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
      optimizedUrl: getOptimizedUrl(req.file.filename, { width: 200, height: 200 })
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({ error: 'Failed to upload avatar' })
  }
})

// Upload service image
router.post('/service-image', authenticateToken, uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const imageUrl = req.file.path || `/uploads/${req.file.filename}`

    res.json({
      message: 'Service image uploaded successfully',
      imageUrl,
      optimizedUrl: getOptimizedUrl(req.file.filename, { width: 800, height: 600 })
    })
  } catch (error) {
    console.error('Service image upload error:', error)
    res.status(500).json({ error: 'Failed to upload service image' })
  }
})

// Upload multiple images for service gallery
router.post('/service-gallery', authenticateToken, uploadMultiple('images', { maxFiles: 5 }), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const images = req.files.map(file => ({
      url: file.path || `/uploads/${file.filename}`,
      filename: file.filename,
      publicId: file.public_id,
      optimizedUrl: getOptimizedUrl(file.filename, { width: 800, height: 600 })
    }))

    res.json({
      message: `${images.length} images uploaded successfully`,
      images
    })
  } catch (error) {
    console.error('Gallery upload error:', error)
    res.status(500).json({ error: 'Failed to upload gallery images' })
  }
})

// Upload healer profile image
router.post('/healer-profile', authenticateToken, uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const imageUrl = req.file.path || `/uploads/${req.file.filename}`

    res.json({
      message: 'Healer profile image uploaded successfully',
      imageUrl,
      optimizedUrl: getOptimizedUrl(req.file.filename, { width: 400, height: 400 })
    })
  } catch (error) {
    console.error('Healer profile upload error:', error)
    res.status(500).json({ error: 'Failed to upload healer profile image' })
  }
})

// Upload message attachment
router.post('/message-attachment', authenticateToken, uploadSingle('attachment'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const attachmentUrl = req.file.path || `/uploads/${req.file.filename}`

    res.json({
      message: 'Message attachment uploaded successfully',
      attachmentUrl,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    })
  } catch (error) {
    console.error('Message attachment upload error:', error)
    res.status(500).json({ error: 'Failed to upload message attachment' })
  }
})

// Delete uploaded file
router.delete('/file/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params
    
    // Only allow users to delete their own files - add ownership check here
    const result = await deleteFile(publicId)
    
    res.json({
      message: 'File deleted successfully',
      result
    })
  } catch (error) {
    console.error('File deletion error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// Get optimized image URL
router.get('/optimize/:publicId', (req, res) => {
  try {
    const { publicId } = req.params
    const { width, height, crop, quality } = req.query

    const optimizedUrl = getOptimizedUrl(publicId, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      crop,
      quality
    })

    res.json({
      originalId: publicId,
      optimizedUrl
    })
  } catch (error) {
    console.error('Image optimization error:', error)
    res.status(500).json({ error: 'Failed to generate optimized URL' })
  }
})

// Handle upload errors
router.use((error, req, res, next) => {
  console.error('Upload middleware error:', error)
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' })
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Too many files or unexpected field name.' })
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message })
  }
  
  res.status(500).json({ error: 'Upload failed' })
})

module.exports = router