const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const availabilityService = require('../services/availabilityService');

const router = express.Router();
const prisma = new PrismaClient();

// Create a new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { serviceId, scheduledAt, notes, customerNotes } = req.body;
    const customerId = req.user.id;

    // Validate required fields
    if (!serviceId || !scheduledAt) {
      return res.status(400).json({ error: 'Service ID and scheduled time are required' });
    }

    // Check if user is a customer
    if (req.user.userType !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can create bookings' });
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { healer: true }
    });

    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    // Check if time slot is available using availability service
    const isAvailable = await availabilityService.isSlotAvailable(
      service.healerId,
      new Date(scheduledAt),
      service.duration
    );

    if (!isAvailable) {
      return res.status(409).json({ error: 'Time slot is not available' });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId,
        healerId: service.healerId,
        serviceId,
        scheduledAt: new Date(scheduledAt),
        duration: service.duration,
        totalPrice: service.price,
        notes,
        customerNotes
      },
      include: {
        service: true,
        healer: {
          include: { profile: true }
        },
        customer: {
          include: { profile: true }
        }
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get bookings for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const userId = req.user.id;
    const userType = req.user.userType;

    let whereClause = {};
    
    if (userType === 'CUSTOMER') {
      whereClause.customerId = userId;
    } else if (userType === 'HEALER') {
      whereClause.healerId = userId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (upcoming === 'true') {
      whereClause.scheduledAt = {
        gte: new Date()
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        service: true,
        healer: {
          include: { profile: true }
        },
        customer: {
          include: { profile: true }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get specific booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        healer: {
          include: { profile: true }
        },
        customer: {
          include: { profile: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (booking.customerId !== userId && booking.healerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Update booking status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason, healerNotes } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check permissions based on status change
    if (status === 'CONFIRMED' || status === 'COMPLETED') {
      if (booking.healerId !== userId) {
        return res.status(403).json({ error: 'Only healers can confirm or complete bookings' });
      }
    } else if (status === 'CANCELLED') {
      if (booking.customerId !== userId && booking.healerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updateData = { 
      status,
      updatedAt: new Date()
    };

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = cancellationReason;
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (healerNotes && booking.healerId === userId) {
      updateData.healerNotes = healerNotes;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        healer: {
          include: { profile: true }
        },
        customer: {
          include: { profile: true }
        }
      }
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get available time slots for a service
router.get('/availability/:serviceId', authenticateToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { healer: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Use availability service to get available slots
    const availableSlots = await availabilityService.getAvailableSlots(
      service.healerId,
      date,
      service.duration
    );

    res.json({
      service: {
        id: service.id,
        title: service.title,
        duration: service.duration,
        price: service.price,
        healer: {
          id: service.healer.id,
          name: `${service.healer.profile?.firstName || ''} ${service.healer.profile?.lastName || ''}`.trim()
        }
      },
      date: date,
      availableSlots
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

module.exports = router;