const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Get admin dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalHealers,
      totalCustomers,
      totalServices,
      totalBookings,
      totalPayments,
      totalReviews,
      recentUsers,
      recentBookings,
      pendingReviews
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'HEALER' } }),
      prisma.user.count({ where: { userType: 'CUSTOMER' } }),
      prisma.service.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.review.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { profile: true }
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { include: { profile: true } },
          healer: { include: { profile: true } },
          service: true
        }
      }),
      prisma.review.findMany({
        where: { isApproved: null },
        take: 10,
        include: {
          customer: { include: { profile: true } },
          healer: { include: { profile: true } },
          service: true
        }
      })
    ])

    const revenue = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    })

    res.json({
      stats: {
        totalUsers,
        totalHealers,
        totalCustomers,
        totalServices,
        totalBookings,
        totalPayments,
        totalReviews,
        totalRevenue: revenue._sum.amount || 0
      },
      recentActivity: {
        recentUsers,
        recentBookings,
        pendingReviews
      }
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

// Get all users with pagination and filtering
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userType, 
      search, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query

    const where = {}
    
    if (userType && ['HEALER', 'CUSTOMER'].includes(userType)) {
      where.userType = userType
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { 
          profile: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } }
            ]
          }
        }
      ]
    }

    if (status === 'verified') {
      where.isVerified = true
    } else if (status === 'unverified') {
      where.isVerified = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              customerBookings: true,
              healerBookings: true,
              services: true,
              customerReviews: true,
              healerReviews: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.user.count({ where })
    ])

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Get user details
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            healerProfile: true
          }
        },
        services: {
          include: {
            _count: {
              select: { bookings: true }
            }
          }
        },
        customerBookings: {
          include: {
            service: true,
            healer: { include: { profile: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        healerBookings: {
          include: {
            service: true,
            customer: { include: { profile: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        customerReviews: {
          include: {
            healer: { include: { profile: true } },
            service: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        healerReviews: {
          include: {
            customer: { include: { profile: true } },
            service: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user details error:', error)
    res.status(500).json({ error: 'Failed to fetch user details' })
  }
})

// Suspend/unsuspend user
router.patch('/users/:userId/suspend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { suspended, reason } = req.body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        isSuspended: suspended,
        suspensionReason: suspended ? reason : null,
        suspendedAt: suspended ? new Date() : null
      },
      include: { profile: true }
    })

    res.json({ user })
  } catch (error) {
    console.error('Suspend user error:', error)
    res.status(500).json({ error: 'Failed to update user status' })
  }
})

// Get all services for moderation
router.get('/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query

    const where = {}
    
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { 
          healer: {
            profile: {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } }
              ]
            }
          }
        }
      ]
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          healer: {
            include: { profile: true }
          },
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.service.count({ where })
    ])

    res.json({
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get services error:', error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// Deactivate/reactivate service
router.patch('/services/:serviceId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { serviceId } = req.params
    const { isActive, reason } = req.body

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: { 
        isActive,
        moderationNotes: reason || null
      },
      include: {
        healer: { include: { profile: true } }
      }
    })

    res.json({ service })
  } catch (error) {
    console.error('Update service status error:', error)
    res.status(500).json({ error: 'Failed to update service status' })
  }
})

// Get all reviews for moderation
router.get('/reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query

    const where = {}
    
    if (status === 'pending') {
      where.isApproved = null
    } else if (status === 'approved') {
      where.isApproved = true
    } else if (status === 'rejected') {
      where.isApproved = false
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: { include: { profile: true } },
          healer: { include: { profile: true } },
          service: true,
          booking: true
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.review.count({ where })
    ])

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// Approve/reject review
router.patch('/reviews/:reviewId/moderate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params
    const { approved, reason } = req.body

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { 
        isApproved: approved,
        moderationNotes: reason || null,
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      },
      include: {
        customer: { include: { profile: true } },
        healer: { include: { profile: true } },
        service: true
      }
    })

    res.json({ review })
  } catch (error) {
    console.error('Moderate review error:', error)
    res.status(500).json({ error: 'Failed to moderate review' })
  }
})

// Get reported content
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const where = {}
    
    if (type && ['USER', 'SERVICE', 'REVIEW', 'MESSAGE'].includes(type)) {
      where.targetType = type
    }
    
    if (status && ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      where.status = status
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            include: { profile: true }
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              warningCount: true,
              isSuspended: true,
              isBanned: true,
              lastWarningAt: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.report.count({ where })
    ])

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// Resolve a report
router.patch('/reports/:reportId/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params
    const { status, resolution, action } = req.body

    if (!['REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Update the report
    const report = await prisma.report.update({
      where: { id: reportId },
      data: { 
        status,
        resolution: resolution || null,
        resolvedAt: new Date(),
        resolvedBy: req.user.id
      },
      include: {
        reporter: { include: { profile: true } },
        targetUser: { include: { profile: true } }
      }
    })

    // Take action if specified
    if (action && report.targetUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: report.targetUserId }
      })
      
      if (action === 'ban') {
        await prisma.user.update({
          where: { id: report.targetUserId },
          data: {
            isBanned: true,
            bannedAt: new Date(),
            banReason: `Report resolved: ${report.reason} - ${resolution}`,
            isSuspended: false // Clear suspension if banned
          }
        })
        
        // Deactivate all services for banned users
        await prisma.service.updateMany({
          where: { healerId: report.targetUserId },
          data: { isActive: false }
        })
        
      } else if (action === 'suspend') {
        await prisma.user.update({
          where: { id: report.targetUserId },
          data: {
            isSuspended: true,
            suspensionReason: `Report resolved: ${report.reason} - ${resolution}`,
            suspendedAt: new Date()
          }
        })
        
        // Deactivate services during suspension
        await prisma.service.updateMany({
          where: { healerId: report.targetUserId },
          data: { isActive: false }
        })
        
      } else if (action === 'warn') {
        const newWarningCount = (targetUser?.warningCount || 0) + 1
        
        await prisma.user.update({
          where: { id: report.targetUserId },
          data: {
            warningCount: newWarningCount,
            lastWarningAt: new Date()
          }
        })
        
        // Auto-escalate to suspension after 3 warnings
        if (newWarningCount >= 3) {
          await prisma.user.update({
            where: { id: report.targetUserId },
            data: {
              isSuspended: true,
              suspensionReason: `Automatic suspension after ${newWarningCount} warnings`,
              suspendedAt: new Date()
            }
          })
          
          await prisma.service.updateMany({
            where: { healerId: report.targetUserId },
            data: { isActive: false }
          })
        }
        
      } else if (action === 'deactivate_services') {
        await prisma.service.updateMany({
          where: { healerId: report.targetUserId },
          data: { isActive: false }
        })
      }
    }

    res.json({ report })
  } catch (error) {
    console.error('Resolve report error:', error)
    res.status(500).json({ error: 'Failed to resolve report' })
  }
})

// Get system logs (basic implementation)
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query

    // This would require a logs table - for now return basic activity
    const activities = await prisma.user.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    res.json({
      logs: activities.map(user => ({
        id: user.id,
        type: 'user_activity',
        description: `User ${user.profile?.firstName || user.email} updated their profile`,
        timestamp: user.updatedAt,
        userId: user.id,
        userEmail: user.email
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        totalPages: Math.ceil(activities.length / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get logs error:', error)
    res.status(500).json({ error: 'Failed to fetch system logs' })
  }
})

module.exports = router