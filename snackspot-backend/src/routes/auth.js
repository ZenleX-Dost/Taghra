// SnackSpot - Authentication Routes
// Register, login, refresh token, etc.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
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
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            throw createError.conflict('Email already registered');
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role, points)
       VALUES ($1, $2, $3, $4, $5, 0)
       RETURNING id, email, full_name, phone, role, points, created_at`,
            [email, passwordHash, fullName, phone, role]
        );

        const user = result.rows[0];

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token
        await db.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
            [user.id, refreshToken]
        );

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
        const result = await db.query(
            'SELECT id, email, password_hash, full_name, phone, role, points FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            throw createError.unauthorized('Invalid email or password');
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw createError.unauthorized('Invalid email or password');
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token
        await db.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
            [user.id, refreshToken]
        );

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
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
        const tokenResult = await db.query(
            'SELECT id FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
            [refreshToken, decoded.userId]
        );

        if (tokenResult.rows.length === 0) {
            throw createError.unauthorized('Refresh token expired or revoked');
        }

        // Delete old refresh token
        await db.query(
            'DELETE FROM refresh_tokens WHERE token = $1',
            [refreshToken]
        );

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        // Store new refresh token
        await db.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
            [decoded.userId, newRefreshToken]
        );

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
    await db.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [req.user.id]
    );

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
