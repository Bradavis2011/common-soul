const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireUserType } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
        ...(specialties !== undefined && { specialties }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(certifications !== undefined && { certifications }),
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

module.exports = router;