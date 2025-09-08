const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        healerProfile: true,
        customerProfile: true
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user's profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { basicInfo, healerInfo, customerInfo } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: {
          include: {
            healerProfile: true,
            customerProfile: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate profile completion score
    const calculateCompletionScore = (basic, healer, customer, userType) => {
      let completed = 0;
      let total = 0;
      
      // Basic fields
      const basicFields = ['firstName', 'lastName', 'bio', 'phone', 'location'];
      basicFields.forEach(field => {
        total++;
        if (basic[field]?.trim()) completed++;
      });

      if (userType === 'HEALER' && healer) {
        const healerFields = ['specialties', 'hourlyRate', 'yearsExperience', 'education'];
        healerFields.forEach(field => {
          total++;
          if (field === 'specialties' && healer[field]?.length > 0) completed++;
          else if (field !== 'specialties' && healer[field]) completed++;
        });
      }

      if (userType === 'CUSTOMER' && customer) {
        const customerFields = ['interests', 'goals', 'budgetRange'];
        customerFields.forEach(field => {
          total++;
          if (field === 'interests' && customer[field]?.length > 0) completed++;
          else if (field !== 'interests' && customer[field]) completed++;
        });
      }

      return Math.round((completed / total) * 100);
    };

    const completionScore = calculateCompletionScore(basicInfo, healerInfo, customerInfo, user.userType);
    const isComplete = completionScore >= 80;

    let updatedProfile;
    
    if (user.profile) {
      // Update existing profile
      updatedProfile = await prisma.userProfile.update({
        where: { id: user.profile.id },
        data: {
          ...basicInfo,
          isProfileComplete: isComplete,
          profileCompletionScore: completionScore,
          updatedAt: new Date()
        },
        include: {
          healerProfile: true,
          customerProfile: true
        }
      });
    } else {
      // Create new profile
      updatedProfile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          ...basicInfo,
          isProfileComplete: isComplete,
          profileCompletionScore: completionScore
        },
        include: {
          healerProfile: true,
          customerProfile: true
        }
      });
    }

    // Handle healer-specific profile
    if (user.userType === 'HEALER' && healerInfo) {
      const healerData = {
        specialties: JSON.stringify(healerInfo.specialties || []),
        hourlyRate: healerInfo.hourlyRate ? parseFloat(healerInfo.hourlyRate) : null,
        yearsExperience: healerInfo.yearsExperience ? parseInt(healerInfo.yearsExperience) : null,
        education: healerInfo.education || null,
        languages: JSON.stringify(healerInfo.languages || []),
        sessionTypes: JSON.stringify(healerInfo.sessionTypes || []),
        consultationFee: healerInfo.consultationFee ? parseFloat(healerInfo.consultationFee) : null,
        sessionDuration: healerInfo.sessionDuration || '60',
        cancellationPolicy: healerInfo.cancellationPolicy || null,
        paymentMethods: JSON.stringify(healerInfo.paymentMethods || []),
        updatedAt: new Date()
      };

      if (updatedProfile.healerProfile) {
        await prisma.healerProfile.update({
          where: { id: updatedProfile.healerProfile.id },
          data: healerData
        });
      } else {
        await prisma.healerProfile.create({
          data: {
            profileId: updatedProfile.id,
            ...healerData
          }
        });
      }
    }

    // Handle customer-specific profile
    if (user.userType === 'CUSTOMER' && customerInfo) {
      const customerData = {
        interests: JSON.stringify(customerInfo.interests || []),
        goals: customerInfo.goals || null,
        previousExperience: customerInfo.previousExperience || null,
        budgetRange: customerInfo.budgetRange || null,
        sessionFrequency: customerInfo.sessionFrequency || null,
        communicationStyle: customerInfo.communicationStyle || null,
        preferredSessionTypes: JSON.stringify(customerInfo.preferredSessionTypes || []),
        updatedAt: new Date()
      };

      if (updatedProfile.customerProfile) {
        await prisma.customerProfile.update({
          where: { id: updatedProfile.customerProfile.id },
          data: customerData
        });
      } else {
        await prisma.customerProfile.create({
          data: {
            profileId: updatedProfile.id,
            ...customerData
          }
        });
      }
    }

    // Fetch the complete updated profile
    const finalProfile = await prisma.userProfile.findUnique({
      where: { id: updatedProfile.id },
      include: {
        healerProfile: true,
        customerProfile: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      profile: finalProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;