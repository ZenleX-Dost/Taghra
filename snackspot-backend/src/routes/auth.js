// TAGHRA - Authentication Routes
// Register, login, refresh token using Supabase Auth

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate JWT tokens (custom tokens for backward compatibility)
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
};

/**
 * POST /api/auth/register
 * Register a new user using Supabase Auth
 */
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('fullName').trim().isLength({ min: 2 }),
        body('phone').optional(),
        body('role').optional().isIn(['user', 'restaurant', 'doctor', 'vet', 'sub']),
    ],
    asyncHandler(async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { email, password, fullName, phone, role = 'user' } = req.body;

        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for development
            user_metadata: {
                full_name: fullName,
                phone,
                role,
            },
        });

        if (authError) {
            console.error('Supabase auth error:', authError);
            if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                throw createError.conflict('Email already registered');
            }
            if (authError.message.includes('Database error')) {
                throw createError.internal('Database setup error. Please ensure the users table exists in Supabase. Run the schema SQL in the SQL Editor.');
            }
            throw createError.internal(authError.message);
        }

        const authUser = authData.user;

        // Create user profile in public.users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authUser.id,
                email: authUser.email,
                full_name: fullName,
                phone: phone || null,
                role,
                points: 0,
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // If profile creation fails, delete the auth user
            await supabase.auth.admin.deleteUser(authUser.id);
            
            if (profileError.message.includes('relation') && profileError.message.includes('does not exist')) {
                throw createError.internal('The users table does not exist. Please run the schema SQL in Supabase SQL Editor.');
            }
            throw createError.internal('Failed to create user profile: ' + profileError.message);
        }

        // Generate custom tokens for the app
        const { accessToken, refreshToken } = generateTokens(authUser.id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: authUser.id,
                email: authUser.email,
                fullName: fullName,
                phone: phone,
                role: role,
                points: 0,
            },
            token: accessToken,
            refreshToken,
        });
    })
);

/**
 * POST /api/auth/login
 * Login user with email and password
 */
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { email, password } = req.body;

        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error('Supabase login error:', authError);
            throw createError.unauthorized('Invalid email or password');
        }

        const authUser = authData.user;

        // Get user profile from public.users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            // User exists in auth but not in profile, create profile
            const { data: newProfile } = await supabase
                .from('users')
                .insert({
                    id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                    phone: authUser.user_metadata?.phone || null,
                    role: authUser.user_metadata?.role || 'user',
                    points: 0,
                })
                .select()
                .single();
        }

        const user = profileData || {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            phone: authUser.user_metadata?.phone || null,
            role: authUser.user_metadata?.role || 'user',
            points: 0,
        };

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', authUser.id);

        // Generate custom tokens for the app
        const { accessToken, refreshToken } = generateTokens(authUser.id);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone,
                role: user.role,
                points: user.points,
            },
            token: accessToken,
            refreshToken,
        });
    })
);

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
router.post('/refresh-token',
    body('refreshToken').notEmpty(),
    asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (error) {
            throw createError.unauthorized('Invalid refresh token');
        }

        if (decoded.type !== 'refresh') {
            throw createError.unauthorized('Invalid token type');
        }

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        res.json({
            success: true,
            token: newAccessToken,
            refreshToken: newRefreshToken,
        });
    })
);

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    // Sign out from Supabase
    await supabase.auth.signOut();

    res.json({
        success: true,
        message: 'Logged out successfully',
    });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error || !user) {
        throw createError.notFound('User not found');
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
            role: user.role,
            points: user.points,
            avatarUrl: user.avatar_url,
            isVerified: user.is_verified,
        },
    });
}));

/**
 * POST /api/auth/social-login
 * Login with social provider (Google, Facebook)
 */
router.post('/social-login',
    [
        body('provider').isIn(['google', 'facebook', 'apple']),
        body('accessToken').notEmpty(),
    ],
    asyncHandler(async (req, res) => {
        const { provider, accessToken } = req.body;

        // In a real implementation, you would:
        // 1. Verify the accessToken with the provider's API
        // 2. Get user info from provider
        // 3. Create or update user in database
        // 4. Generate JWT tokens

        // For now, return a placeholder response
        res.status(501).json({
            success: false,
            message: `${provider} login not yet implemented`,
        });
    })
);

module.exports = router;
