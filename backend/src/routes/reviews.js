const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Get reviews for a specific healer
router.get('/healer/:healerId', async (req, res) => {
  try {
    const { healerId } = req.params
    const { page = 1, limit = 10 } = req.query
    
    const skip = (page - 1) * limit
    
    const reviews = await prisma.review.findMany({
      where: {
        healerId,
        isPublic: true
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        service: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    })
    
    const totalReviews = await prisma.review.count({
      where: {
        healerId,
        isPublic: true
      }
    })
    
    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        healerId,
        isPublic: true
      },
      _avg: {
        rating: true
      }
    })
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      },
      averageRating: avgRating._avg.rating || 0,
      totalReviews
    })
  } catch (error) {
    console.error('Get healer reviews error:', error)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// Get reviews for a specific service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const { page = 1, limit = 10 } = req.query
    
    const skip = (page - 1) * limit
    
    const reviews = await prisma.review.findMany({
      where: {
        serviceId,
        isPublic: true
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        healer: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    })
    
    const totalReviews = await prisma.review.count({
      where: {
        serviceId,
        isPublic: true
      }
    })
    
    // Calculate average rating for service
    const avgRating = await prisma.review.aggregate({
      where: {
        serviceId,
        isPublic: true
      },
      _avg: {
        rating: true
      }
    })
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      },
      averageRating: avgRating._avg.rating || 0,
      totalReviews
    })
  } catch (error) {
    console.error('Get service reviews error:', error)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// Create a new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id
    const { healerId, serviceId, bookingId, rating, title, comment, isPublic = true } = req.body
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }
    
    // Check if user is a customer
    if (req.user.userType !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can create reviews' })
    }
    
    // If bookingId is provided, verify the booking exists and belongs to the customer
    let isVerified = false
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          customerId,
          status: 'COMPLETED'
        }
      })
      
      if (!booking) {
        return res.status(400).json({ error: 'Invalid booking or booking not completed' })
      }
      
      // Check if review already exists for this booking
      const existingReview = await prisma.review.findUnique({
        where: { bookingId }
      })
      
      if (existingReview) {
        return res.status(400).json({ error: 'Review already exists for this booking' })
      }
      
      isVerified = true
    }
    
    // Verify healer and service exist
    const healer = await prisma.user.findUnique({
      where: { id: healerId }
    })
    
    if (!healer || healer.userType !== 'HEALER') {
      return res.status(400).json({ error: 'Invalid healer' })
    }
    
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      })
      
      if (!service || service.healerId !== healerId) {
        return res.status(400).json({ error: 'Invalid service or service does not belong to healer' })
      }
    }
    
    const review = await prisma.review.create({
      data: {
        customerId,
        healerId,
        serviceId,
        bookingId,
        rating,
        title,
        comment,
        isVerified,
        isPublic
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        healer: {
          include: {
            profile: true
          }
        },
        service: true,
        booking: true
      }
    })
    
    res.status(201).json(review)
  } catch (error) {
    console.error('Create review error:', error)
    res.status(500).json({ error: 'Failed to create review' })
  }
})

// Update review (customers can edit their own reviews)
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params
    const { rating, title, comment, isPublic } = req.body
    
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    })
    
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' })
    }
    
    if (existingReview.customerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reviews' })
    }
    
    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        healer: {
          include: {
            profile: true
          }
        },
        service: true
      }
    })
    
    res.json(updatedReview)
  } catch (error) {
    console.error('Update review error:', error)
    res.status(500).json({ error: 'Failed to update review' })
  }
})

// Add healer response to review
router.post('/:reviewId/response', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params
    const { response } = req.body
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'Response cannot be empty' })
    }
    
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    })
    
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' })
    }
    
    // Check if user is the healer for this review
    if (existingReview.healerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only respond to reviews for your services' })
    }
    
    if (existingReview.response) {
      return res.status(400).json({ error: 'Response already exists for this review' })
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        response: response.trim(),
        respondedAt: new Date()
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        service: true
      }
    })
    
    res.json(updatedReview)
  } catch (error) {
    console.error('Add response error:', error)
    res.status(500).json({ error: 'Failed to add response' })
  }
})

// Delete review (customers can delete their own reviews)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params
    
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    })
    
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' })
    }
    
    if (existingReview.customerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' })
    }
    
    await prisma.review.delete({
      where: { id: reviewId }
    })
    
    res.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Delete review error:', error)
    res.status(500).json({ error: 'Failed to delete review' })
  }
})

// Get customer's own reviews
router.get('/my-reviews', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can access this endpoint' })
    }
    
    const reviews = await prisma.review.findMany({
      where: {
        customerId: req.user.id
      },
      include: {
        healer: {
          include: {
            profile: true
          }
        },
        service: true,
        booking: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    res.json(reviews)
  } catch (error) {
    console.error('Get my reviews error:', error)
    res.status(500).json({ error: 'Failed to fetch your reviews' })
  }
})

// Get reviews received by a healer (for healer dashboard)
router.get('/healer-reviews', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'HEALER') {
      return res.status(403).json({ error: 'Only healers can access this endpoint' })
    }
    
    const reviews = await prisma.review.findMany({
      where: {
        healerId: req.user.id
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        service: true,
        booking: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    res.json(reviews)
  } catch (error) {
    console.error('Get healer reviews error:', error)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

module.exports = router