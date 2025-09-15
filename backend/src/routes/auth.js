const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Test database connectivity
router.get('/test', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const userCount = await prisma.user.count();
    const healerCount = await prisma.user.count({ where: { userType: 'HEALER' } });
    const customerCount = await prisma.user.count({ where: { userType: 'CUSTOMER' } });
    
    res.json({ 
      status: 'Authentication service operational',
      database: 'connected',
      stats: {
        totalUsers: userCount,
        healers: healerCount,
        customers: customerCount
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['HEALER', 'CUSTOMER']).withMessage('User type must be HEALER or CUSTOMER'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, userType, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userType,
        profile: {
          create: {
            firstName,
            lastName,
            ...(userType === 'HEALER' && {
              healerProfile: {
                create: {}
              }
            }),
            ...(userType === 'CUSTOMER' && {
              customerProfile: {
                create: {}
              }
            })
          }
        }
      },
      include: {
        profile: {
          include: {
            healerProfile: true,
            customerProfile: true
          }
        }
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful. Please remove token from client storage.' });
});

// TEMPORARY: Payment endpoint test in auth routes
router.get('/payment-test', (req, res) => {
  res.json({
    message: 'Payment endpoint working in auth routes!',
    timestamp: new Date().toISOString(),
    note: 'This confirms routing works when placed in auth.js'
  });
});

module.exports = router;