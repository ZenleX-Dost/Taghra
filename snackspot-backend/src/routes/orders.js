// Taghra - Orders Routes
// Food ordering system

const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/orders/create
 * Create a new order
 */
router.post('/create',
    authenticate,
    [
        body('placeId').notEmpty().isUUID(),
        body('items').isArray({ min: 1 }),
        body('items.*.menuItemId').isUUID(),
        body('items.*.quantity').isInt({ min: 1, max: 99 }),
        body('deliveryAddress').optional().trim(),
        body('notes').optional().trim().isLength({ max: 500 }),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { placeId, items, deliveryAddress, notes } = req.body;
        const userId = req.user.id;

        // Verify place exists
        const place = await db.query('SELECT id, name FROM places WHERE id = $1', [placeId]);
        if (place.rows.length === 0) {
            throw createError.notFound('Place not found');
        }

        // Get menu items and calculate total
        const itemIds = items.map(i => i.menuItemId);
        const menuItems = await db.query(
            'SELECT id, name, price FROM menu_items WHERE id = ANY($1)',
            [itemIds]
        );

        const menuItemMap = new Map(menuItems.rows.map(m => [m.id, m]));
        let subtotal = 0;
        const orderItems = items.map(item => {
            const menuItem = menuItemMap.get(item.menuItemId);
            if (!menuItem) throw createError.badRequest(`Menu item ${item.menuItemId} not found`);
            const itemTotal = parseFloat(menuItem.price) * item.quantity;
            subtotal += itemTotal;
            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: item.quantity,
                price: parseFloat(menuItem.price),
                total: itemTotal,
            };
        });

        const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
        const total = subtotal + serviceFee;

        // Create order
        const orderId = uuidv4();
        const result = await db.query(`
      INSERT INTO orders (id, user_id, place_id, items, subtotal, service_fee, total, delivery_address, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING id, status, created_at
    `, [orderId, userId, placeId, JSON.stringify(orderItems), subtotal, serviceFee, total, deliveryAddress, notes]);

        // Award points
        const pointsEarned = Math.floor(total / 10);
        if (pointsEarned > 0) {
            await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [pointsEarned, userId]);
        }

        // Emit socket event
        const io = req.app.get('io');
        io.to(`place:${placeId}`).emit('order:new', { orderId, placeName: place.rows[0].name });

        res.status(201).json({
            success: true,
            message: 'Order created',
            data: {
                orderId: result.rows[0].id,
                status: result.rows[0].status,
                subtotal,
                serviceFee,
                total,
                pointsEarned,
                createdAt: result.rows[0].created_at,
            },
        });
    })
);

/**
 * GET /api/orders/my-orders
 * Get user's orders
 */
router.get('/my-orders', authenticate, asyncHandler(async (req, res) => {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
    SELECT o.id, o.place_id, p.name as place_name, o.items, o.total, o.status, o.created_at
    FROM orders o
    JOIN places p ON o.place_id = p.id
    WHERE o.user_id = $1
  `;
    const params = [req.user.id];

    if (status) {
        query += ` AND o.status = $${params.length + 1}`;
        params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
        success: true,
        data: result.rows.map(o => ({
            id: o.id,
            placeId: o.place_id,
            placeName: o.place_name,
            items: o.items,
            total: parseFloat(o.total),
            status: o.status,
            createdAt: o.created_at,
        })),
    });
}));

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const result = await db.query(`
    SELECT o.*, p.name as place_name, p.address as place_address, p.phone as place_phone
    FROM orders o
    JOIN places p ON o.place_id = p.id
    WHERE o.id = $1 AND o.user_id = $2
  `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
        throw createError.notFound('Order not found');
    }

    res.json({ success: true, data: result.rows[0] });
}));

/**
 * PUT /api/orders/:id/cancel
 * Cancel an order
 */
router.put('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const result = await db.query(`
    UPDATE orders SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3 AND status = 'pending'
    RETURNING id, status
  `, [reason, req.params.id, req.user.id]);

    if (result.rows.length === 0) {
        throw createError.badRequest('Order cannot be cancelled');
    }

    res.json({ success: true, message: 'Order cancelled', data: result.rows[0] });
}));

module.exports = router;
