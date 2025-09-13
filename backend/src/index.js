const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const healerRoutes = require('./routes/healer');
const serviceRoutes = require('./routes/service');
const reviewRoutes = require('./routes/reviews');
const bookingRoutes = require('./routes/booking');
const availabilityRoutes = require('./routes/availability');
const paymentRoutes = require('./routes/payment');
const messagingRoutes = require('./routes/messaging');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const credentialRoutes = require('./routes/credentials');
const forumRoutes = require('./routes/forum');
const socketService = require('./services/socketService');
const { PrismaClient } = require('@prisma/client');

const app = express();

// Initialize database on startup
async function initializeDatabase() {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('Initializing database...');
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
          if (error) {
            console.error('Database initialization error:', error);
            // Don't reject - continue startup even if db push fails
            resolve();
          } else {
            console.log('Database initialized successfully');
            console.log(stdout);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Continue startup anyway
    }
  }
}
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://common-soul.vercel.app'
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:8084', 'http://localhost:8085'],
  credentials: true
}));

// Rate limiting - completely disabled for development
// if (process.env.NODE_ENV === 'production') {
//   const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100
//   });
//   app.use('/api/auth', rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 5
//   }));
//   app.use(limiter);
// }

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static('public/uploads'));

// API-only backend - frontend is deployed separately on Vercel

// Logging
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/healers', healerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/forum', forumRoutes);

// Root endpoint with helpful information
app.get('/', (req, res) => {
  res.json({
    message: 'Common Soul API Server',
    status: 'running',
    frontend_url: 'http://localhost:5173',
    api_endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      services: '/api/services',
      bookings: '/api/bookings',
      payments: '/api/payments',
      messaging: '/api/messaging',
      admin: '/api/admin',
      health: '/health'
    },
    note: 'This is the backend API. Visit http://localhost:5173 for the main application.'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Debug endpoint for environment variables (only in production for now)
app.get('/debug', (req, res) => {
  const env = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL;
  res.json({
    node_env: env,
    database_url_present: !!dbUrl,
    database_url_type: dbUrl ? (dbUrl.startsWith('postgres') ? 'postgresql' : 'other') : 'none'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize Socket.IO
socketService.init(server);

// Start server with database initialization
async function startServer() {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  }).on('error', (error) => {
    console.error('Server error:', error);
  });
}

startServer();
