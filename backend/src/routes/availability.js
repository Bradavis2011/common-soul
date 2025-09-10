const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const availabilityService = require('../services/availabilityService');

const router = express.Router();

// Get healer's availability schedule
router.get('/:healerId', async (req, res) => {
  try {
    const { healerId } = req.params;
    
    const availability = await availabilityService.getAllHealerAvailability(healerId);
    
    res.json({
      healerId,
      availability
    });
  } catch (error) {
    console.error('Error fetching healer availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Get my availability (healer only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (req.user.userType !== 'HEALER') {
      return res.status(403).json({ error: 'Only healers can access their availability' });
    }
    
    const availability = await availabilityService.getAllHealerAvailability(userId);
    
    res.json({
      healerId: userId,
      availability
    });
  } catch (error) {
    console.error('Error fetching my availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update healer availability (healer only)
router.put('/schedule', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;
    
    if (req.user.userType !== 'HEALER') {
      return res.status(403).json({ error: 'Only healers can update their availability' });
    }
    
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Schedule must be an array' });
    }
    
    // Validate schedule items
    for (const item of schedule) {
      if (typeof item.dayOfWeek !== 'number' || item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        return res.status(400).json({ error: 'Invalid dayOfWeek. Must be 0-6' });
      }
      
      if (typeof item.isAvailable !== 'boolean') {
        return res.status(400).json({ error: 'isAvailable must be boolean' });
      }
      
      if (item.isAvailable) {
        if (!item.startTime || !item.endTime) {
          return res.status(400).json({ error: 'startTime and endTime required when available' });
        }
        
        // Validate time format (HH:MM:SS)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(item.startTime) || !timeRegex.test(item.endTime)) {
          return res.status(400).json({ error: 'Invalid time format. Use HH:MM:SS' });
        }
      }
    }
    
    // Update availability for each day
    const updatedAvailability = [];
    for (const item of schedule) {
      const updated = await availabilityService.updateHealerAvailability(userId, item);
      updatedAvailability.push(updated);
    }
    
    res.json({
      message: 'Availability updated successfully',
      availability: updatedAvailability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Update single day availability
router.put('/day/:dayOfWeek', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dayOfWeek } = req.params;
    const availabilityData = req.body;
    
    if (req.user.userType !== 'HEALER') {
      return res.status(403).json({ error: 'Only healers can update their availability' });
    }
    
    const dayNum = parseInt(dayOfWeek);
    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return res.status(400).json({ error: 'Invalid dayOfWeek. Must be 0-6' });
    }
    
    availabilityData.dayOfWeek = dayNum;
    
    const updated = await availabilityService.updateHealerAvailability(userId, availabilityData);
    
    res.json({
      message: 'Day availability updated successfully',
      availability: updated
    });
  } catch (error) {
    console.error('Error updating day availability:', error);
    res.status(500).json({ error: 'Failed to update day availability' });
  }
});

// Get available slots for a specific date and service
router.get('/slots/:healerId', async (req, res) => {
  try {
    const { healerId } = req.params;
    const { date, duration } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    if (!duration) {
      return res.status(400).json({ error: 'Duration parameter is required' });
    }
    
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }
    
    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Don't allow booking in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (targetDate < now) {
      return res.json({
        healerId,
        date,
        availableSlots: []
      });
    }
    
    const availableSlots = await availabilityService.getAvailableSlots(
      healerId, 
      date, 
      durationMinutes
    );
    
    res.json({
      healerId,
      date,
      availableSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Check if specific slot is available
router.post('/check-slot', async (req, res) => {
  try {
    const { healerId, scheduledAt, duration } = req.body;
    
    if (!healerId || !scheduledAt || !duration) {
      return res.status(400).json({ error: 'healerId, scheduledAt, and duration are required' });
    }
    
    const isAvailable = await availabilityService.isSlotAvailable(
      healerId, 
      new Date(scheduledAt), 
      parseInt(duration)
    );
    
    res.json({
      available: isAvailable,
      healerId,
      scheduledAt,
      duration
    });
  } catch (error) {
    console.error('Error checking slot availability:', error);
    res.status(500).json({ error: 'Failed to check slot availability' });
  }
});

// Initialize default availability for healer
router.post('/init', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (req.user.userType !== 'HEALER') {
      return res.status(403).json({ error: 'Only healers can initialize availability' });
    }
    
    const availability = await availabilityService.createDefaultAvailability(userId);
    
    res.json({
      message: 'Default availability created successfully',
      availability
    });
  } catch (error) {
    console.error('Error initializing availability:', error);
    res.status(500).json({ error: 'Failed to initialize availability' });
  }
});

module.exports = router;