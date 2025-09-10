const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Report reasons mapping
const REPORT_REASONS = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Inappropriate Content',
  FRAUD: 'Suspected Fraud',
  NO_SHOW: 'No Show / Cancellation Issue',
  UNPROFESSIONAL: 'Unprofessional Behavior',
  SAFETY: 'Safety Concern',
  OTHER: 'Other'
};

const TARGET_TYPES = {
  USER: 'USER',
  SERVICE: 'SERVICE',
  REVIEW: 'REVIEW',
  MESSAGE: 'MESSAGE'
};

// Create a new report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const reporterId = req.user.id;

    // Validate input
    if (!Object.values(TARGET_TYPES).includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    if (!Object.keys(REPORT_REASONS).includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    if (!targetId) {
      return res.status(400).json({ error: 'Target ID is required' });
    }

    // Prevent users from reporting themselves
    if (targetType === 'USER' && targetId === reporterId) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Check if user already reported this target
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        targetType,
        targetId
      }
    });

    if (existingReport) {
      return res.status(409).json({ error: 'You have already reported this content' });
    }

    // Get target user ID if reporting a user or service
    let targetUserId = null;
    if (targetType === 'USER') {
      targetUserId = targetId;
    } else if (targetType === 'SERVICE') {
      const service = await prisma.service.findUnique({
        where: { id: targetId },
        select: { healerId: true }
      });
      targetUserId = service?.healerId;
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        targetUserId,
        reason,
        details: details || null
      },
      include: {
        reporter: {
          include: { profile: true }
        },
        targetUser: {
          include: { profile: true }
        }
      }
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        id: report.id,
        targetType: report.targetType,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get user's reports (reports they created)
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: req.user.id },
      include: {
        targetUser: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report statistics for a user
router.get('/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to see their own stats or admins to see any stats
    if (req.user.id !== userId && req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await prisma.report.groupBy({
      by: ['status'],
      where: { targetUserId: userId },
      _count: true
    });

    const totalReports = await prisma.report.count({
      where: { targetUserId: userId }
    });

    const recentReports = await prisma.report.count({
      where: {
        targetUserId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    res.json({
      totalReports,
      recentReports,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ error: 'Failed to fetch report statistics' });
  }
});

module.exports = router;