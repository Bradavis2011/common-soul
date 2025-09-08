const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

// Import routes
const authRoutes = require('../src/routes/auth')
const profileRoutes = require('../src/routes/profile')
const uploadRoutes = require('../src/routes/upload')
const healerRoutes = require('../src/routes/healer')
const serviceRoutes = require('../src/routes/service')
const reviewRoutes = require('../src/routes/reviews')
const bookingRoutes = require('../src/routes/booking')
const paymentRoutes = require('../src/routes/payment')
const messagingRoutes = require('../src/routes/messaging')
const adminRoutes = require('../src/routes/admin')

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}))

// Parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'))
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/healers', healerRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/messaging', messagingRoutes)
app.use('/api/admin', adminRoutes)

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Common Soul API Server',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      services: '/api/services',
      bookings: '/api/bookings',
      payments: '/api/payments',
      messaging: '/api/messaging',
      admin: '/api/admin',
      health: '/api/health'
    }
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  })
})

// Export for Vercel
module.exports = app