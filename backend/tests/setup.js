require('dotenv').config({ path: '.env.test' })

// Mock console.log in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn()
}

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'file:./test.db'

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  })),
}))

jest.mock('stripe', () => {
  const mockStripe = {
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    charges: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  }
  
  return jest.fn(() => mockStripe)
})

// Global test timeout
jest.setTimeout(10000)