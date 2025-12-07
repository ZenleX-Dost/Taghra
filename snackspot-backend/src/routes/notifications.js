// TAGHRA - Notifications Routes
// Push notifications and in-app notifications

const express = require('express');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { unreadOnly, limit = 50, offset = 0 } = req.query;

    let query = `
    SELECT id, title, body, type, data, is_read, created_at
    FROM notifications
    WHERE user_id = $1
  `;
    const params = [req.user.id];

    if (unreadOnly === 'true') {
        query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get unread count
    const unreadCount = await db.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [req.user.id]
    );

    res.json({
        success: true,
        data: result.rows,
        unreadCount: parseInt(unreadCount.rows[0].count),
    });
}));

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
    await db.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );

    res.json({ success: true, message: 'Marked as read' });
}));

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
    await db.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [req.user.id]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
}));

/**
 * POST /api/notifications/register-device
 * Register device for push notifications
 */
router.post('/register-device', authenticate, asyncHandler(async (req, res) => {
    const { token, platform = 'expo' } = req.body;

    if (!token) {
        throw createError.badRequest('Device token required');
    }

    // Upsert device token
    await db.query(`
    INSERT INTO device_tokens (user_id, token, platform)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, token) DO UPDATE SET updated_at = NOW()
  `, [req.user.id, token, platform]);

    res.json({ success: true, message: 'Device registered' });
}));

module.exports = router;
