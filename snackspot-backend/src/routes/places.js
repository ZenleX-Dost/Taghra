// Taghra - Places Routes
// CRUD operations for places with geolocation

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Database = require('../utils/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/places/nearby
 * Get places near a location with optional filters
 */
router.get('/nearby',
    [
        query('lat').isFloat({ min: -90, max: 90 }),
        query('lng').isFloat({ min: -180, max: 180 }),
        query('radius').optional().isInt({ min: 100, max: 50000 }),
        query('category').optional().isIn(['food', 'health', 'vet', 'admin']),
        query('open').optional().isBoolean(),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    optionalAuth,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const {
            lat,
            lng,
            radius = 1000,
            category,
            open,
            limit = 20,
            offset = 0,
        } = req.query;

        // Use custom PostgreSQL function for nearby places
        const { data: places, error } = await Database.rpc('get_nearby_places', {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius_meters: parseInt(radius),
            place_category: category || null,
            is_open_filter: open !== undefined ? (open === 'true') : null,
            result_limit: parseInt(limit),
            result_offset: parseInt(offset)
        });

        if (error) {
            throw createError.internal('Failed to fetch nearby places');
        }

        res.json({
            success: true,
            data: result.rows.map(place => ({
                id: place.id,
                name: place.name,
                category: place.category,
                description: place.description,
                address: place.address,
                phone: place.phone,
                latitude: place.latitude,
                longitude: place.longitude,
                distance: Math.round(place.distance),
                rating: parseFloat(place.rating) || 0,
                reviewCount: place.review_count,
                priceLevel: place.price_level,
                isOpen: place.is_open,
                photos: place.photos || [],
            })),
            meta: {
                total: result.rows.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    })
);

/**
 * GET /api/places/search
 * Search places by name or keyword
 */
router.get('/search',
    [
        query('query').notEmpty().trim(),
        query('lat').optional().isFloat(),
        query('lng').optional().isFloat(),
        query('limit').optional().isInt({ min: 1, max: 50 }),
    ],
    asyncHandler(async (req, res) => {
        const { query: searchQuery, lat, lng, limit = 20 } = req.query;

        let queryText = `
      SELECT 
        id, name, category, address, rating, review_count,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
    `;

        const params = [`%${searchQuery}%`];

        // Add distance if coordinates provided
        if (lat && lng) {
            queryText += `,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
        ) as distance
      `;
            params.push(lng, lat);
        }

        queryText += `
      FROM places
      WHERE name ILIKE $1 OR description ILIKE $1 OR address ILIKE $1
    `;

        // Order by distance if available, otherwise by rating
        if (lat && lng) {
            queryText += ` ORDER BY distance LIMIT $4`;
            params.push(limit);
        } else {
            queryText += ` ORDER BY rating DESC NULLS LAST LIMIT $2`;
            params.push(limit);
        }

        const result = await db.query(queryText, params);

        res.json({
            success: true,
            data: result.rows,
        });
    })
);

/**
 * GET /api/places/:id
 * Get place details by ID
 */
router.get('/:id',
    optionalAuth,
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await db.query(`
      SELECT 
        p.*,
        ST_Y(p.location::geometry) as latitude,
        ST_X(p.location::geometry) as longitude,
        u.full_name as owner_name
      FROM places p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            throw createError.notFound('Place not found');
        }

        const place = result.rows[0];

        res.json({
            success: true,
            data: {
                id: place.id,
                name: place.name,
                category: place.category,
                description: place.description,
                address: place.address,
                phone: place.phone,
                website: place.website,
                latitude: place.latitude,
                longitude: place.longitude,
                rating: parseFloat(place.rating) || 0,
                reviewCount: place.review_count,
                priceLevel: place.price_level,
                isOpen: place.is_open,
                openingHours: place.opening_hours,
                photos: place.photos || [],
                features: place.features || [],
                tags: place.tags || [],
                ownerName: place.owner_name,
                createdAt: place.created_at,
            },
        });
    })
);

/**
 * GET /api/places/:id/menu
 * Get menu for a food place
 */
router.get('/:id/menu',
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Check if place exists and is food category
        const placeResult = await db.query(
            'SELECT id, category FROM places WHERE id = $1',
            [id]
        );

        if (placeResult.rows.length === 0) {
            throw createError.notFound('Place not found');
        }

        if (placeResult.rows[0].category !== 'food') {
            throw createError.badRequest('Menu only available for food places');
        }

        const result = await db.query(`
      SELECT 
        mc.id as category_id,
        mc.name as category_name,
        mc.sort_order,
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image,
        mi.is_available
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mc.id = mi.category_id AND mi.is_available = true
      WHERE mc.place_id = $1
      ORDER BY mc.sort_order, mi.sort_order
    `, [id]);

        // Group items by category
        const menuByCategory = {};
        result.rows.forEach(row => {
            if (!menuByCategory[row.category_id]) {
                menuByCategory[row.category_id] = {
                    id: row.category_id,
                    name: row.category_name,
                    items: [],
                };
            }
            if (row.id) {
                menuByCategory[row.category_id].items.push({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    price: parseFloat(row.price),
                    image: row.image,
                    isAvailable: row.is_available,
                });
            }
        });

        res.json({
            success: true,
            data: Object.values(menuByCategory),
        });
    })
);

/**
 * GET /api/places/:id/reviews
 * Get reviews for a place
 */
router.get('/:id/reviews',
    [
        query('limit').optional().isInt({ min: 1, max: 50 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const result = await db.query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.photos,
        r.tags,
        r.helpful_count,
        r.created_at,
        u.id as user_id,
        u.full_name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.place_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

        res.json({
            success: true,
            data: result.rows.map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                photos: r.photos || [],
                tags: r.tags || [],
                helpfulCount: r.helpful_count,
                createdAt: r.created_at,
                user: {
                    id: r.user_id,
                    name: r.user_name,
                },
            })),
        });
    })
);

/**
 * POST /api/places/:id/reviews
 * Add a review to a place
 */
router.post('/:id/reviews',
    authenticate,
    [
        body('rating').isInt({ min: 1, max: 5 }),
        body('comment').optional().trim().isLength({ max: 1000 }),
        body('tags').optional().isArray(),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { id } = req.params;
        const { rating, comment, tags = [], photos = [] } = req.body;
        const userId = req.user.id;

        // Check if place exists
        const placeResult = await db.query('SELECT id FROM places WHERE id = $1', [id]);
        if (placeResult.rows.length === 0) {
            throw createError.notFound('Place not found');
        }

        // Check if user already reviewed
        const existingReview = await db.query(
            'SELECT id FROM reviews WHERE place_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingReview.rows.length > 0) {
            throw createError.conflict('You have already reviewed this place');
        }

        // Create review
        const result = await db.query(`
      INSERT INTO reviews (place_id, user_id, rating, comment, tags, photos)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, rating, comment, tags, photos, created_at
    `, [id, userId, rating, comment, tags, photos]);

        // Update place rating
        await db.query(`
      UPDATE places SET
        rating = (SELECT AVG(rating) FROM reviews WHERE place_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = $1)
      WHERE id = $1
    `, [id]);

        // Award points to user
        const pointsToAward = photos.length > 0 ? 5 : 3;
        await db.query(
            'UPDATE users SET points = points + $1 WHERE id = $2',
            [pointsToAward, userId]
        );

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: result.rows[0],
            pointsEarned: pointsToAward,
        });
    })
);

module.exports = router;
