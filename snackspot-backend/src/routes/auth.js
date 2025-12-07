// Taghra - Authentication Routes
// Register, login, refresh token, etc.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Database = require('../utils/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate JWT tokens
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
 * Register a new user
 */
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('fullName').trim().isLength({ min: 2 }),
        body('phone').optional().isMobilePhone('ar-MA'),
        body('role').optional().isIn(['user', 'restaurant', 'doctor', 'vet', 'sub']),
    ],
    asyncHandler(async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { email, password, fullName, phone, role = 'user' } = req.body;

        // Check if user exists
        const { data: existingUser } = await Database.select('users', {
            columns: 'id',
            filters: { email },
            single: true
        });

        if (existingUser) {
            throw createError.conflict('Email already registered');
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const { data: newUsers, error: insertError } = await Database.insert('users', {
            email,
            password_hash: passwordHash,
            full_name: fullName,
            phone,
            role,
            points: 0
        });

        if (insertError) {
            throw createError.internal('Failed to create user');
        }

        const user = newUsers[0];

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token
        await Database.insert('refresh_tokens', {
            user_id: user.id,
            token: refreshToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
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

        // Get user
        const { data: user, error } = await Database.select('users', {
            columns: 'id, email, password_hash, full_name, phone, role, points',
            filters: { email },
            single: true
        });

        if (error || !user) {
            throw createError.unauthorized('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw createError.unauthorized('Invalid email or password');
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token
        await Database.insert('refresh_tokens', {
            user_id: user.id,
            token: refreshToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        // Update last login
        await Database.update('users', 
            { last_login: new Date().toISOString() },
            { id: user.id }
        );

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

        // Check if token exists in database
        const { data: tokenData } = await Database.select('refresh_tokens', {
            columns: 'id',
            filters: { 
                token: refreshToken,
                user_id: decoded.userId
            },
            single: true
        });

        if (!tokenData) {
            throw createError.unauthorized('Refresh token expired or revoked');
        }

        // Delete old refresh token
        await Database.delete('refresh_tokens', { token: refreshToken });

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        // Store new refresh token
        await Database.insert('refresh_tokens', {
            user_id: decoded.userId,
            token: newRefreshToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

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
    // Delete all refresh tokens for this user
    await Database.delete('refresh_tokens', { user_id: req.user.id });

    res.json({
        success: true,
        message: 'Logged out successfully',
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
