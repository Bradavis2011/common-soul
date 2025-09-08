const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireUserType } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const validServiceCategories = [
  'REIKI_HEALING',
  'ENERGY_HEALING', 
  'SPIRITUAL_COUNSELING',
  'CHAKRA_ALIGNMENT',
  'TAROT_READING',
  'MEDITATION_GUIDANCE',
  'CRYSTAL_HEALING',
  'AURA_CLEANSING',
  'SOUND_HEALING',
  'BREATHWORK',
  'ASTROLOGY',
  'NUMEROLOGY'
];

// Get current healer's services
router.get('/my-services', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { healerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ services });
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all services (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { category, healerId, isActive = 'true' } = req.query;
    
    const where = {
      isActive: isActive === 'true',
      ...(category && validServiceCategories.includes(category) && { category }),
      ...(healerId && { healerId })
    };

    const services = await prisma.service.findMany({
      where,
      include: {
        healer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                healerProfile: {
                  select: {
                    specialties: true,
                    yearsExperience: true
                  }
                }
              }
            }
          }
        },
        reviews: {
          where: {
            isPublic: true
          },
          select: {
            id: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new service (healer only)
router.post('/', authenticateToken, requireUserType('HEALER'), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be under 1000 characters'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(validServiceCategories).withMessage('Invalid service category'),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, duration, price, category, imageUrl, isActive = true } = req.body;

    const service = await prisma.service.create({
      data: {
        title,
        description,
        duration,
        price,
        category,
        imageUrl,
        isActive,
        healerId: req.user.id
      },
      include: {
        healer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Service created successfully',
      service 
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific service
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        healer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                bio: true,
                avatarUrl: true,
                healerProfile: {
                  select: {
                    specialties: true,
                    hourlyRate: true,
                    yearsExperience: true,
                    certifications: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service (owner only)
router.put('/:id', authenticateToken, requireUserType('HEALER'), [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be under 100 characters'),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be under 1000 characters'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().isIn(validServiceCategories).withMessage('Invalid service category'),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, duration, price, category, imageUrl, isActive } = req.body;

    // Check if service exists and belongs to the user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        healerId: req.user.id
      }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found or not owned by user' });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        healer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    res.json({ 
      message: 'Service updated successfully',
      service: updatedService 
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service (owner only)
router.delete('/:id', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists and belongs to the user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        healerId: req.user.id
      }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found or not owned by user' });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({ message: 'Service deleted successfully' });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;