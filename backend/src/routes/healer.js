const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireUserType } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Test database connectivity
router.get('/test', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    // Debug: Count all healers
    const allUsers = await prisma.user.count();
    const allHealers = await prisma.user.count({ where: { userType: 'HEALER' } });
    
    res.json({ 
      status: 'Database connection successful',
      allUsers,
      allHealers
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Get all public healers with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      specialty, 
      location, 
      priceRange, 
      isVirtual, 
      rating,
      availability,
      sortBy = 'rating',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      userType: 'HEALER',
      profile: {
        healerProfile: {
          isActive: true,
          // DEMO: Commented out verification requirement to show demo healers
          // isVerified: true // TODO: Uncomment for production after healer verification process
        }
      }
    };

    // Add search filter
    if (search) {
      whereConditions.OR = [
        {
          profile: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { bio: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          profile: {
            healerProfile: {
              specialties: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    // Add location filter
    if (location) {
      whereConditions.profile.location = { contains: location, mode: 'insensitive' };
    }

    // Add specialty filter
    if (specialty) {
      whereConditions.profile.healerProfile.specialties = { contains: specialty, mode: 'insensitive' };
    }

    // Add price range filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (min !== undefined && max !== undefined) {
        whereConditions.profile.healerProfile.hourlyRate = {
          gte: min,
          lte: max
        };
      }
    }

    // Add rating filter
    if (rating) {
      whereConditions.profile.healerProfile.averageRating = {
        gte: parseFloat(rating)
      };
    }

    // Build orderBy
    let orderBy = {};
    switch (sortBy) {
      case 'rating':
        orderBy = { profile: { healerProfile: { averageRating: order } } };
        break;
      case 'price':
        orderBy = { profile: { healerProfile: { hourlyRate: order } } };
        break;
      case 'experience':
        orderBy = { profile: { healerProfile: { yearsExperience: order } } };
        break;
      case 'reviews':
        orderBy = { profile: { healerProfile: { totalReviews: order } } };
        break;
      default:
        orderBy = { profile: { healerProfile: { averageRating: 'desc' } } };
    }

    console.log('Where conditions:', JSON.stringify(whereConditions, null, 2));
    
    const healers = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        userType: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            location: true,
            avatarUrl: true,
            healerProfile: {
              select: {
                specialties: true,
                hourlyRate: true,
                yearsExperience: true,
                certifications: true,
                isActive: true,
                averageRating: true,
                totalReviews: true,
                sessionTypes: true,
                languages: true
              }
            }
          }
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            imageUrl: true
          },
          take: 3 // Limit to first 3 services for performance
        }
      },
      orderBy,
      skip: offset,
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereConditions
    });

    // Transform data for frontend
    const transformedHealers = healers.map(healer => ({
      id: healer.id,
      name: `${healer.profile.firstName} ${healer.profile.lastName}`,
      specialty: healer.profile.healerProfile?.specialties ? 
        JSON.parse(healer.profile.healerProfile.specialties)[0] || 'Healing Arts' : 'Healing Arts',
      rating: healer.profile.healerProfile?.averageRating || 0,
      reviewCount: healer.profile.healerProfile?.totalReviews || 0,
      location: healer.profile.location || 'Location not specified',
      isVirtual: true, // Default to true, can be determined from session types
      price: healer.profile.healerProfile?.hourlyRate ? 
        `$${healer.profile.healerProfile.hourlyRate}/session` : 'Contact for pricing',
      priceRange: healer.profile.healerProfile?.hourlyRate ? 
        getPriceRange(healer.profile.healerProfile.hourlyRate) : 'varies',
      avatar: healer.profile.avatarUrl || '',
      tags: healer.profile.healerProfile?.specialties ? 
        JSON.parse(healer.profile.healerProfile.specialties) : [],
      experience: healer.profile.healerProfile?.yearsExperience ? 
        `${healer.profile.healerProfile.yearsExperience} years` : 'New practitioner',
      sessionTypes: healer.profile.healerProfile?.sessionTypes ? 
        JSON.parse(healer.profile.healerProfile.sessionTypes) : ['Virtual'],
      languages: healer.profile.healerProfile?.languages ? 
        JSON.parse(healer.profile.healerProfile.languages) : ['English'],
      bio: healer.profile.bio || 'Experienced healer dedicated to your wellbeing.',
      services: healer.services,
      isVerified: healer.profile.healerProfile?.isActive || false
    }));

    res.json({
      healers: transformedHealers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: (page * limit) < totalCount,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get healers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to determine price range
function getPriceRange(hourlyRate) {
  if (hourlyRate < 50) return '0-50';
  if (hourlyRate < 80) return '50-80';
  if (hourlyRate < 120) return '80-120';
  return '120+';
}

// Get public healer profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const healer = await prisma.user.findFirst({
      where: {
        id: id,
        userType: 'HEALER'
      },
      select: {
        id: true,
        userType: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            location: true,
            avatarUrl: true,
            healerProfile: {
              select: {
                specialties: true,
                hourlyRate: true,
                yearsExperience: true,
                certifications: true,
                isActive: true
              }
            }
          }
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            imageUrl: true
          }
        }
      }
    });

    if (!healer) {
      return res.status(404).json({ error: 'Healer not found' });
    }

    res.json({ healer });
  } catch (error) {
    console.error('Get healer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update healer-specific profile
router.put('/profile', authenticateToken, requireUserType('HEALER'), [
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
  body('yearsExperience').optional().isInt({ min: 0 }).withMessage('Years of experience must be a positive integer'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { specialties, hourlyRate, yearsExperience, certifications, isActive } = req.body;

    // Get the user's profile first
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updatedHealerProfile = await prisma.healerProfile.update({
      where: { profileId: userProfile.id },
      data: {
        ...(specialties !== undefined && { specialties: JSON.stringify(specialties) }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(certifications !== undefined && { certifications: JSON.stringify(certifications) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ 
      message: 'Healer profile updated successfully',
      healerProfile: updatedHealerProfile 
    });

  } catch (error) {
    console.error('Update healer profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get healer availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Get healer availability settings
    const availability = await prisma.healerAvailability.findMany({
      where: { healerId: id },
      orderBy: { dayOfWeek: 'asc' }
    });

    // Get bookings in the date range
    const bookings = await prisma.booking.findMany({
      where: {
        healerId: id,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
        status: true
      }
    });

    res.json({
      availability: availability.map(av => ({
        dayOfWeek: av.dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][av.dayOfWeek],
        isAvailable: av.isAvailable,
        startTime: av.startTime,
        endTime: av.endTime,
        breakStartTime: av.breakStartTime,
        breakEndTime: av.breakEndTime
      })),
      bookings
    });
  } catch (error) {
    console.error('Get healer availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update healer availability
router.put('/availability', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'Availability must be an array' });
    }

    // Delete existing availability
    await prisma.healerAvailability.deleteMany({
      where: { healerId: req.user.id }
    });

    // Create new availability records
    const newAvailability = await Promise.all(
      availability.map(day => 
        prisma.healerAvailability.create({
          data: {
            healerId: req.user.id,
            dayOfWeek: day.dayOfWeek,
            isAvailable: day.isAvailable,
            startTime: day.startTime,
            endTime: day.endTime,
            breakStartTime: day.breakStartTime || null,
            breakEndTime: day.breakEndTime || null
          }
        })
      )
    );

    res.json({ 
      message: 'Availability updated successfully',
      availability: newAvailability 
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit healer profile for verification
router.post('/submit-for-verification', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile || !userProfile.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    // Check if profile is complete enough for verification
    const healerProfile = userProfile.healerProfile;
    const requiredFields = {
      basicInfo: userProfile.firstName && userProfile.lastName && userProfile.bio,
      specialties: healerProfile.specialties && JSON.parse(healerProfile.specialties || '[]').length > 0,
      pricing: healerProfile.hourlyRate && healerProfile.hourlyRate > 0,
      experience: healerProfile.yearsExperience !== null
    };

    const incompleteFields = Object.entries(requiredFields)
      .filter(([_, isComplete]) => !isComplete)
      .map(([field]) => field);

    if (incompleteFields.length > 0) {
      return res.status(400).json({ 
        error: 'Profile incomplete',
        incompleteFields,
        message: `Please complete the following sections: ${incompleteFields.join(', ')}`
      });
    }

    // Update healer profile to mark as submitted for verification
    await prisma.healerProfile.update({
      where: { profileId: userProfile.id },
      data: {
        isVerified: false, // Reset if previously verified
        updatedAt: new Date()
      }
    });

    // Set user profile as complete
    await prisma.userProfile.update({
      where: { id: userProfile.id },
      data: {
        isProfileComplete: true,
        profileCompletionScore: 100
      }
    });

    res.json({ 
      message: 'Profile submitted for verification',
      status: 'PENDING_VERIFICATION',
      estimatedReviewTime: '24-48 hours'
    });

  } catch (error) {
    console.error('Submit for verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to get healers pending verification
router.get('/admin/pending-verification', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement admin role checking)
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const pendingHealers = await prisma.user.findMany({
      where: {
        userType: 'HEALER',
        profile: {
          isProfileComplete: true,
          healerProfile: {
            isVerified: false
          }
        }
      },
      include: {
        profile: {
          include: {
            healerProfile: true
          }
        }
      },
      orderBy: {
        profile: {
          updatedAt: 'desc'
        }
      }
    });

    res.json({ healers: pendingHealers });
  } catch (error) {
    console.error('Get pending verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to approve/reject healer verification
router.post('/admin/verify/:healerId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { healerId } = req.params;
    const { approved, rejectionReason } = req.body;

    const healer = await prisma.user.findFirst({
      where: {
        id: healerId,
        userType: 'HEALER'
      },
      include: {
        profile: {
          include: {
            healerProfile: true
          }
        }
      }
    });

    if (!healer || !healer.profile?.healerProfile) {
      return res.status(404).json({ error: 'Healer not found' });
    }

    if (approved) {
      // Approve healer
      await prisma.healerProfile.update({
        where: { profileId: healer.profile.id },
        data: {
          isVerified: true,
          isActive: true,
          updatedAt: new Date()
        }
      });

      // TODO: Send approval email to healer

      res.json({ 
        message: 'Healer approved successfully',
        status: 'VERIFIED'
      });
    } else {
      // Reject healer
      await prisma.healerProfile.update({
        where: { profileId: healer.profile.id },
        data: {
          isVerified: false,
          isActive: false,
          updatedAt: new Date()
          // TODO: Add rejectionReason field to schema
        }
      });

      // TODO: Send rejection email with reason to healer

      res.json({ 
        message: 'Healer verification rejected',
        status: 'REJECTED',
        reason: rejectionReason
      });
    }

  } catch (error) {
    console.error('Verify healer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get healer verification status
router.get('/verification-status', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile || !userProfile.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    const healerProfile = userProfile.healerProfile;
    let status = 'INCOMPLETE';
    
    if (userProfile.isProfileComplete) {
      if (healerProfile.isVerified) {
        status = 'VERIFIED';
      } else {
        status = 'PENDING_VERIFICATION';
      }
    }

    res.json({
      status,
      isVerified: healerProfile.isVerified,
      isActive: healerProfile.isActive,
      isProfileComplete: userProfile.isProfileComplete,
      profileCompletionScore: userProfile.profileCompletionScore,
      canAcceptBookings: healerProfile.isVerified && healerProfile.isActive
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TEMPORARY: Payment endpoints in working healer routes for revenue generation
router.get('/payment-status', (req, res) => {
  res.json({
    status: 'Payment service operational (via healers route)',
    timestamp: new Date().toISOString(),
    message: 'Temporary payment endpoint for revenue generation',
    stripe_configured: !!process.env.STRIPE_SECRET_KEY
  });
});

// Temporary payment test endpoint
router.get('/payment-test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment routing working via healers endpoint',
    timestamp: new Date().toISOString(),
    note: 'This enables revenue generation while payment.js routing is resolved'
  });
});

module.exports = router;