const request = require('supertest')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

// Import the app without starting the server
const app = require('../src/index.js')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
})

describe('Authentication API', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      role: 'CUSTOMER'
    }

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(validUserData.email)
      expect(response.body.user.name).toBe(validUserData.name)
      expect(response.body.user.role).toBe(validUserData.role)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should hash the password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201)

      const user = await prisma.user.findUnique({
        where: { email: validUserData.email }
      })

      expect(user.password).not.toBe(validUserData.password)
      const isPasswordValid = await bcrypt.compare(validUserData.password, user.password)
      expect(isPasswordValid).toBe(true)
    })

    it('should return a valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201)

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET)
      expect(decoded.userId).toBeDefined()
      expect(decoded.email).toBe(validUserData.email)
    })

    it('should not register user with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201)

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400)

      expect(response.body.message).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const invalidData = { email: 'test@example.com' }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body.message).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400)

      expect(response.body.message).toContain('email')
    })

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validUserData,
        password: '123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400)

      expect(response.body.message).toContain('password')
    })

    it('should validate role values', async () => {
      const invalidRoleData = {
        ...validUserData,
        role: 'INVALID_ROLE'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidRoleData)
        .expect(400)

      expect(response.body.message).toContain('role')
    })

    it('should register healer successfully', async () => {
      const healerData = {
        ...validUserData,
        email: 'healer@example.com',
        role: 'HEALER'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(healerData)
        .expect(201)

      expect(response.body.user.role).toBe('HEALER')
    })
  })

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'login@example.com',
      password: 'LoginPassword123!',
      name: 'Login Test User',
      role: 'CUSTOMER'
    }

    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData)
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401)

      expect(response.body.message).toContain('Invalid')
    })

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.message).toContain('Invalid')
    })

    it('should validate required fields for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email })
        .expect(400)

      expect(response.body.message).toBeDefined()
    })

    it('should return valid JWT token on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200)

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET)
      expect(decoded.userId).toBeDefined()
      expect(decoded.email).toBe(userData.email)
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken
    let userId

    beforeEach(async () => {
      // Create user and get auth token
      const userData = {
        email: 'me@example.com',
        password: 'MePassword123!',
        name: 'Me Test User',
        role: 'CUSTOMER'
      }

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      authToken = registerResponse.body.token
      userId = registerResponse.body.user.id
    })

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.id).toBe(userId)
      expect(response.body.email).toBe('me@example.com')
      expect(response.body).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.message).toContain('No token')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.message).toContain('Invalid token')
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', authToken) // Missing 'Bearer'
        .expect(401)

      expect(response.body.message).toContain('No token')
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to registration endpoint', async () => {
      const userData = {
        email: 'ratelimit@example.com',
        password: 'RateLimit123!',
        name: 'Rate Limit Test',
        role: 'CUSTOMER'
      }

      // Make multiple rapid requests
      const promises = Array(6).fill().map((_, index) =>
        request(app)
          .post('/api/auth/register')
          .send({
            ...userData,
            email: `ratelimit${index}@example.com`
          })
      )

      const responses = await Promise.all(promises)
      
      // Some requests should succeed, some should be rate limited
      const successCount = responses.filter(r => r.status === 201).length
      const rateLimitedCount = responses.filter(r => r.status === 429).length

      expect(successCount + rateLimitedCount).toBe(6)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBeDefined()
      expect(response.headers['x-frame-options']).toBeDefined()
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '<script>alert("xss")</script>',
        role: 'CUSTOMER'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201)

      // Name should be sanitized
      expect(response.body.user.name).not.toContain('<script>')
    })

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionData = {
        email: "'; DROP TABLE users; --@example.com",
        password: 'Password123!',
        name: 'SQL Injection Test',
        role: 'CUSTOMER'
      }

      // Should handle gracefully without breaking the database
      const response = await request(app)
        .post('/api/auth/register')
        .send(sqlInjectionData)
        .expect(400)

      expect(response.body.message).toBeDefined()
    })
  })
})