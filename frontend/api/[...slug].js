// Vercel serverless function to handle all API routes
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

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

// Routes
app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)
app.use('/upload', uploadRoutes)
app.use('/healers', healerRoutes)
app.use('/services', serviceRoutes)
app.use('/reviews', reviewRoutes)
app.use('/bookings', bookingRoutes)
app.use('/payments', paymentRoutes)
app.use('/messaging', messagingRoutes)
app.use('/admin', adminRoutes)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Common Soul API',
    status: 'running'
  })
})

// Export for Vercel
module.exports = app