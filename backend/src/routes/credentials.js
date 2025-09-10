const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireUserType } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/credentials/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow documents, images, and PDFs
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents, images, and PDFs are allowed'));
    }
  }
});

// Upload credential document
router.post('/upload-document', authenticateToken, requireUserType('HEALER'), upload.single('document'), async (req, res) => {
  try {
    const { documentType, documentName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!documentType || !documentName) {
      return res.status(400).json({ error: 'Document type and name are required' });
    }

    // Get healer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    // Create document record
    const document = await prisma.healerDocument.create({
      data: {
        healerProfileId: userProfile.healerProfile.id,
        documentType,
        documentName,
        fileUrl: `/uploads/credentials/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        verificationStatus: 'PENDING'
      }
    });

    res.json({ 
      message: 'Document uploaded successfully',
      document 
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add certification
router.post('/certifications', authenticateToken, requireUserType('HEALER'), [
  body('certificationName').notEmpty().withMessage('Certification name is required'),
  body('issuingOrganization').notEmpty().withMessage('Issuing organization is required'),
  body('issueDate').optional().isISO8601().withMessage('Invalid issue date'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      certificationName,
      issuingOrganization,
      certificationNumber,
      issueDate,
      expiryDate,
      verificationUrl,
      documentId
    } = req.body;

    // Get healer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    const certification = await prisma.healerCertification.create({
      data: {
        healerProfileId: userProfile.healerProfile.id,
        certificationName,
        issuingOrganization,
        certificationNumber,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        verificationUrl,
        documentId
      }
    });

    res.json({ 
      message: 'Certification added successfully',
      certification 
    });

  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add education
router.post('/education', authenticateToken, requireUserType('HEALER'), [
  body('institutionName').notEmpty().withMessage('Institution name is required'),
  body('degreeTitle').notEmpty().withMessage('Degree title is required'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      institutionName,
      degreeType,
      degreeTitle,
      fieldOfStudy,
      startDate,
      endDate,
      graduationStatus,
      gpa,
      honors,
      documentId
    } = req.body;

    // Get healer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    const education = await prisma.healerEducation.create({
      data: {
        healerProfileId: userProfile.healerProfile.id,
        institutionName,
        degreeType,
        degreeTitle,
        fieldOfStudy,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        graduationStatus,
        gpa,
        honors,
        documentId
      }
    });

    res.json({ 
      message: 'Education added successfully',
      education 
    });

  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add experience
router.post('/experience', authenticateToken, requireUserType('HEALER'), [
  body('organizationName').notEmpty().withMessage('Organization name is required'),
  body('positionTitle').notEmpty().withMessage('Position title is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      organizationName,
      positionTitle,
      employmentType,
      startDate,
      endDate,
      isCurrent,
      description,
      keyAchievements,
      location,
      verificationContactName,
      verificationContactEmail,
      verificationContactPhone
    } = req.body;

    // Get healer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    const experience = await prisma.healerExperience.create({
      data: {
        healerProfileId: userProfile.healerProfile.id,
        organizationName,
        positionTitle,
        employmentType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: Boolean(isCurrent),
        description,
        keyAchievements,
        location,
        verificationContactName,
        verificationContactEmail,
        verificationContactPhone
      }
    });

    res.json({ 
      message: 'Experience added successfully',
      experience 
    });

  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add reference
router.post('/references', authenticateToken, requireUserType('HEALER'), [
  body('referenceType').isIn(['PROFESSIONAL', 'ACADEMIC', 'CLIENT', 'MENTOR']).withMessage('Invalid reference type'),
  body('contactName').notEmpty().withMessage('Contact name is required'),
  body('relationship').notEmpty().withMessage('Relationship is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      referenceType,
      contactName,
      contactTitle,
      organization,
      relationship,
      email,
      phone,
      yearsKnown
    } = req.body;

    // Get healer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    const reference = await prisma.healerReference.create({
      data: {
        healerProfileId: userProfile.healerProfile.id,
        referenceType,
        contactName,
        contactTitle,
        organization,
        relationship,
        email,
        phone,
        yearsKnown: yearsKnown ? parseInt(yearsKnown) : null
      }
    });

    res.json({ 
      message: 'Reference added successfully',
      reference 
    });

  } catch (error) {
    console.error('Add reference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get healer's complete credential profile
router.get('/profile', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    // Get healer profile with all credentials
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        healerProfile: {
          include: {
            documents: true,
            certifications: {
              include: { document: true }
            },
            education: {
              include: { document: true }
            },
            experience: true,
            references: true,
            backgroundCheck: true,
            verificationChecklist: true
          }
        }
      }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    res.json({ credentials: userProfile.healerProfile });

  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint: Get credentials for verification
router.get('/admin/pending-verification', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const pendingCredentials = await prisma.healerProfile.findMany({
      where: {
        verificationChecklist: {
          overallStatus: 'PENDING'
        }
      },
      include: {
        profile: {
          include: {
            user: {
              select: { id: true, email: true, createdAt: true }
            }
          }
        },
        documents: true,
        certifications: true,
        education: true,
        experience: true,
        references: true,
        backgroundCheck: true,
        verificationChecklist: true
      }
    });

    res.json({ credentials: pendingCredentials });

  } catch (error) {
    console.error('Get pending credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint: Verify specific credential
router.post('/admin/verify-document/:documentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { documentId } = req.params;
    const { status, notes } = req.body; // 'VERIFIED', 'REJECTED'

    const document = await prisma.healerDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verificationNotes: notes,
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      }
    });

    res.json({ 
      message: 'Document verification updated',
      document 
    });

  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initiate background check
router.post('/background-check', authenticateToken, requireUserType('HEALER'), async (req, res) => {
  try {
    const { checkType } = req.body; // 'CRIMINAL', 'IDENTITY', etc.

    // Get healer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      include: { healerProfile: true }
    });

    if (!userProfile?.healerProfile) {
      return res.status(404).json({ error: 'Healer profile not found' });
    }

    // Check if background check already exists
    const existingCheck = await prisma.healerBackgroundCheck.findUnique({
      where: { healerProfileId: userProfile.healerProfile.id }
    });

    if (existingCheck) {
      return res.status(400).json({ error: 'Background check already initiated' });
    }

    // Create background check record
    const backgroundCheck = await prisma.healerBackgroundCheck.create({
      data: {
        healerProfileId: userProfile.healerProfile.id,
        checkType,
        status: 'PENDING',
        // In production, integrate with background check service here
        provider: 'DEMO_PROVIDER'
      }
    });

    res.json({ 
      message: 'Background check initiated',
      backgroundCheck 
    });

  } catch (error) {
    console.error('Background check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;