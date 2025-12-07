// Taghra - Users Routes
// User profile and gamification

const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const result = await db.query(`
    SELECT id, email, full_name, phone, role, points, avatar_url, created_at, last_login
    FROM users WHERE id = $1
  `, [req.user.id]);

    const user = result.rows[0];

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
            role: user.role,
            points: user.points,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at,
            lastLogin: user.last_login,
        },
    });
}));

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile',
    authenticate,
    [
        body('fullName').optional().trim().isLength({ min: 2 }),
        body('phone').optional().isMobilePhone('ar-MA'),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { fullName, phone } = req.body;
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (fullName) {
            updates.push(`full_name = $${paramIndex++}`);
            values.push(fullName);
        }
        if (phone) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }

        if (updates.length === 0) {
            throw createError.badRequest('No fields to update');
        }

        values.push(req.user.id);
        const result = await db.query(`
      UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, phone, role, points
    `, values);

        res.json({
            success: true,
            message: 'Profile updated',
            data: result.rows[0],
        });
    })
);

/**
 * GET /api/users/points-history
 * Get user's points transaction history
 */
router.get('/points-history', authenticate, asyncHandler(async (req, res) => {
    const result = await db.query(`
    SELECT id, points, action, description, created_at
    FROM points_history
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [req.user.id]);

    res.json({
        success: true,
        data: result.rows,
    });
}));

/**
 * GET /api/users/badges
 * Get user's earned badges
 */
router.get('/badges', authenticate, asyncHandler(async (req, res) => {
    const result = await db.query(`
    SELECT b.id, b.name, b.description, b.icon, b.points_required, ub.earned_at
    FROM badges b
    JOIN user_badges ub ON b.id = ub.badge_id
    WHERE ub.user_id = $1
    ORDER BY ub.earned_at DESC
  `, [req.user.id]);

    res.json({
        success: true,
        data: result.rows,
    });
}));

/**
 * GET /api/users/leaderboard
 * Get top users by points
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const result = await db.query(`
    SELECT id, full_name, points, role,
      RANK() OVER (ORDER BY points DESC) as rank
    FROM users
    WHERE points > 0
    ORDER BY points DESC
    LIMIT $1
  `, [Math.min(parseInt(limit), 100)]);

    res.json({
        success: true,
        data: result.rows.map(u => ({
            id: u.id,
            name: u.full_name,
            points: u.points,
            role: u.role,
            rank: parseInt(u.rank),
        })),
    });
}));

module.exports = router;
