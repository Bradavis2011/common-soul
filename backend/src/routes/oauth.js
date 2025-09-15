const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            userType: user.userType,
            provider: user.provider
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Helper function to get user role selection URL
const getRoleSelectionUrl = (token, userType = null) => {
    const baseUrl = process.env.FRONTEND_URL || 'https://thecommonsoul.com';
    if (userType) {
        return `${baseUrl}/dashboard?token=${token}&role=${userType}`;
    }
    return `${baseUrl}/select-role?token=${token}`;
};

// Google OAuth Routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
        try {
            const user = req.user;
            const token = generateToken(user);

            // Check if user needs to select their role
            if (!user.profile || user.userType === 'CUSTOMER') {
                // Redirect to role selection or dashboard
                const redirectUrl = getRoleSelectionUrl(token, user.userType);
                return res.redirect(redirectUrl);
            }

            // User has complete profile, redirect to dashboard
            const dashboardUrl = `${process.env.FRONTEND_URL || 'https://thecommonsoul.com'}/dashboard?token=${token}`;
            res.redirect(dashboardUrl);

        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect('/login?error=oauth_callback_failed');
        }
    }
);

// Facebook OAuth Routes
router.get('/facebook',
    passport.authenticate('facebook', {
        scope: ['email']
    })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
        try {
            const user = req.user;
            const token = generateToken(user);

            // Check if user needs to select their role
            if (!user.profile || user.userType === 'CUSTOMER') {
                // Redirect to role selection or dashboard
                const redirectUrl = getRoleSelectionUrl(token, user.userType);
                return res.redirect(redirectUrl);
            }

            // User has complete profile, redirect to dashboard
            const dashboardUrl = `${process.env.FRONTEND_URL || 'https://thecommonsoul.com'}/dashboard?token=${token}`;
            res.redirect(dashboardUrl);

        } catch (error) {
            console.error('Facebook OAuth callback error:', error);
            res.redirect('/login?error=oauth_callback_failed');
        }
    }
);

// Role selection endpoint for OAuth users
router.post('/select-role', async (req, res) => {
    try {
        const { token, userType } = req.body;

        if (!token || !userType) {
            return res.status(400).json({
                error: 'Token and userType are required'
            });
        }

        if (!['HEALER', 'CUSTOMER'].includes(userType)) {
            return res.status(400).json({
                error: 'Invalid userType. Must be HEALER or CUSTOMER'
            });
        }

        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Update user's role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                userType,
                updatedAt: new Date()
            },
            include: {
                profile: true
            }
        });

        // Create appropriate profile if needed
        if (userType === 'HEALER' && updatedUser.profile) {
            // Check if healer profile exists
            const existingHealerProfile = await prisma.healerProfile.findUnique({
                where: { profileId: updatedUser.profile.id }
            });

            if (!existingHealerProfile) {
                await prisma.healerProfile.create({
                    data: {
                        profileId: updatedUser.profile.id
                    }
                });
            }
        } else if (userType === 'CUSTOMER' && updatedUser.profile) {
            // Check if customer profile exists
            const existingCustomerProfile = await prisma.customerProfile.findUnique({
                where: { profileId: updatedUser.profile.id }
            });

            if (!existingCustomerProfile) {
                await prisma.customerProfile.create({
                    data: {
                        profileId: updatedUser.profile.id
                    }
                });
            }
        }

        // Generate new token with updated role
        const newToken = generateToken(updatedUser);

        res.json({
            message: 'Role selected successfully',
            token: newToken,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                userType: updatedUser.userType,
                provider: updatedUser.provider,
                profile: updatedUser.profile
            }
        });

    } catch (error) {
        console.error('Role selection error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(500).json({
            error: 'Failed to update user role',
            details: error.message
        });
    }
});

// Get OAuth user info endpoint
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
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
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't send sensitive data
        const { password, providerData, ...safeUser } = user;

        res.json({
            user: safeUser,
            isOAuthUser: !!user.provider,
            provider: user.provider
        });

    } catch (error) {
        console.error('Get user info error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(500).json({
            error: 'Failed to get user info',
            details: error.message
        });
    }
});

// Link OAuth account to existing account
router.post('/link-account', async (req, res) => {
    try {
        const { email, password, provider, providerToken } = req.body;

        if (!email || !password || !provider || !providerToken) {
            return res.status(400).json({
                error: 'Email, password, provider, and providerToken are required'
            });
        }

        // Verify the existing account
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!existingUser) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Verify password if user has one (not OAuth-only)
        if (existingUser.password) {
            const bcrypt = require('bcrypt');
            const isValidPassword = await bcrypt.compare(password, existingUser.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        // Decode the provider token to get OAuth info
        const oauthDecoded = jwt.verify(providerToken, process.env.JWT_SECRET);

        // Find the OAuth user
        const oauthUser = await prisma.user.findUnique({
            where: { id: oauthDecoded.userId }
        });

        if (!oauthUser || oauthUser.provider !== provider) {
            return res.status(400).json({ error: 'Invalid OAuth account' });
        }

        // Link the accounts by updating the existing user with OAuth info
        const linkedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                provider: oauthUser.provider,
                providerId: oauthUser.providerId,
                providerData: oauthUser.providerData,
                isVerified: true
            },
            include: {
                profile: true
            }
        });

        // Delete the OAuth-only user record
        await prisma.user.delete({
            where: { id: oauthUser.id }
        });

        // Generate new token for the linked account
        const newToken = generateToken(linkedUser);

        res.json({
            message: 'Accounts linked successfully',
            token: newToken,
            user: {
                id: linkedUser.id,
                email: linkedUser.email,
                userType: linkedUser.userType,
                provider: linkedUser.provider
            }
        });

    } catch (error) {
        console.error('Account linking error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(500).json({
            error: 'Failed to link accounts',
            details: error.message
        });
    }
});

// Unlink OAuth provider from account
router.post('/unlink', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user has a password (can't unlink if OAuth is only login method)
        if (!user.password && user.provider) {
            return res.status(400).json({
                error: 'Cannot unlink OAuth account without setting a password first'
            });
        }

        // Unlink OAuth
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                provider: null,
                providerId: null,
                providerData: null
            }
        });

        res.json({
            message: 'OAuth account unlinked successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                userType: updatedUser.userType,
                provider: null
            }
        });

    } catch (error) {
        console.error('OAuth unlink error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(500).json({
            error: 'Failed to unlink OAuth account',
            details: error.message
        });
    }
});

module.exports = router;