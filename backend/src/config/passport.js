const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true
            }
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy - only initialize if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Google ID
        let user = await prisma.user.findFirst({
            where: {
                AND: [
                    { provider: 'google' },
                    { providerId: profile.id }
                ]
            },
            include: {
                profile: true
            }
        });

        if (user) {
            // User exists, update their data
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    providerData: JSON.stringify({
                        accessToken,
                        refreshToken,
                        profile: {
                            id: profile.id,
                            displayName: profile.displayName,
                            emails: profile.emails,
                            photos: profile.photos
                        }
                    })
                },
                include: {
                    profile: true
                }
            });
            return done(null, user);
        }

        // Check if user exists with the same email
        const emailAddress = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (emailAddress) {
            const existingUser = await prisma.user.findUnique({
                where: { email: emailAddress },
                include: { profile: true }
            });

            if (existingUser) {
                // Link Google account to existing user
                const updatedUser = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        provider: 'google',
                        providerId: profile.id,
                        providerData: JSON.stringify({
                            accessToken,
                            refreshToken,
                            profile: {
                                id: profile.id,
                                displayName: profile.displayName,
                                emails: profile.emails,
                                photos: profile.photos
                            }
                        }),
                        isVerified: true // Auto-verify OAuth users
                    },
                    include: { profile: true }
                });
                return done(null, updatedUser);
            }
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email: emailAddress || `google_${profile.id}@placeholder.com`,
                provider: 'google',
                providerId: profile.id,
                userType: 'CUSTOMER', // Default to customer, can be changed later
                isVerified: true, // Auto-verify OAuth users
                providerData: JSON.stringify({
                    accessToken,
                    refreshToken,
                    profile: {
                        id: profile.id,
                        displayName: profile.displayName,
                        emails: profile.emails,
                        photos: profile.photos
                    }
                })
            }
        });

        // Create user profile
        const names = profile.displayName ? profile.displayName.split(' ') : ['', ''];
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        await prisma.userProfile.create({
            data: {
                userId: newUser.id,
                firstName,
                lastName,
                avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            }
        });

        // Fetch complete user with profile
        const completeUser = await prisma.user.findUnique({
            where: { id: newUser.id },
            include: { profile: true }
        });

        return done(null, completeUser);

    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));
} else {
    console.log('Google OAuth not configured - skipping Google strategy');
}

// Facebook OAuth Strategy - only initialize if credentials are available
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Facebook ID
        let user = await prisma.user.findFirst({
            where: {
                AND: [
                    { provider: 'facebook' },
                    { providerId: profile.id }
                ]
            },
            include: {
                profile: true
            }
        });

        if (user) {
            // User exists, update their data
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    providerData: JSON.stringify({
                        accessToken,
                        refreshToken,
                        profile: {
                            id: profile.id,
                            name: profile.name,
                            emails: profile.emails,
                            photos: profile.photos
                        }
                    })
                },
                include: {
                    profile: true
                }
            });
            return done(null, user);
        }

        // Check if user exists with the same email
        const emailAddress = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (emailAddress) {
            const existingUser = await prisma.user.findUnique({
                where: { email: emailAddress },
                include: { profile: true }
            });

            if (existingUser) {
                // Link Facebook account to existing user
                const updatedUser = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        provider: 'facebook',
                        providerId: profile.id,
                        providerData: JSON.stringify({
                            accessToken,
                            refreshToken,
                            profile: {
                                id: profile.id,
                                name: profile.name,
                                emails: profile.emails,
                                photos: profile.photos
                            }
                        }),
                        isVerified: true // Auto-verify OAuth users
                    },
                    include: { profile: true }
                });
                return done(null, updatedUser);
            }
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email: emailAddress || `facebook_${profile.id}@placeholder.com`,
                provider: 'facebook',
                providerId: profile.id,
                userType: 'CUSTOMER', // Default to customer, can be changed later
                isVerified: true, // Auto-verify OAuth users
                providerData: JSON.stringify({
                    accessToken,
                    refreshToken,
                    profile: {
                        id: profile.id,
                        name: profile.name,
                        emails: profile.emails,
                        photos: profile.photos
                    }
                })
            }
        });

        // Create user profile
        const firstName = profile.name ? profile.name.givenName || '' : '';
        const lastName = profile.name ? profile.name.familyName || '' : '';

        await prisma.userProfile.create({
            data: {
                userId: newUser.id,
                firstName,
                lastName,
                avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            }
        });

        // Fetch complete user with profile
        const completeUser = await prisma.user.findUnique({
            where: { id: newUser.id },
            include: { profile: true }
        });

        return done(null, completeUser);

    } catch (error) {
        console.error('Facebook OAuth error:', error);
        return done(error, null);
    }
}));
} else {
    console.log('Facebook OAuth not configured - skipping Facebook strategy');
}

module.exports = passport;