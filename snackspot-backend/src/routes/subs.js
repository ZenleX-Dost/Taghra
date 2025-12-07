// TAGHRA - Subs Routes
// Ambassador (Sub) place submissions

const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate, isSub } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/places/',
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only images allowed'));
    },
});

/**
 * POST /api/subs/add-place
 * Submit a new place for review
 */
router.post('/add-place',
    authenticate,
    isSub,
    upload.array('photos', 5),
    [
        body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
        body('category').isIn(['food', 'health', 'vet', 'admin']),
        body('address').trim().notEmpty(),
        body('latitude').isFloat({ min: -90, max: 90 }),
        body('longitude').isFloat({ min: -180, max: 180 }),
        body('phone').optional().isMobilePhone('ar-MA'),
        body('description').optional().trim().isLength({ max: 500 }),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { name, category, address, latitude, longitude, phone, description } = req.body;
        const photos = req.files ? req.files.map(f => `/uploads/places/${f.filename}`) : [];

        // Create submission
        const submissionId = uuidv4();
        await db.query(`
      INSERT INTO place_submissions 
      (id, sub_id, name, category, address, location, phone, description, photos, status)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9, $10, 'pending')
    `, [submissionId, req.user.id, name, category, address, longitude, latitude, phone, description, photos]);

        res.status(201).json({
            success: true,
            message: 'Place submitted for review. You will earn 10 points once approved!',
            data: { id: submissionId, status: 'pending' },
        });
    })
);

/**
 * GET /api/subs/my-submissions
 * Get sub's place submissions
 */
router.get('/my-submissions', authenticate, isSub, asyncHandler(async (req, res) => {
    const { status } = req.query;

    let query = `
    SELECT id, name, category, address, status, created_at, reviewed_at, rejection_reason
    FROM place_submissions WHERE sub_id = $1
  `;
    const params = [req.user.id];

    if (status) {
        query += ` AND status = $2`;
        params.push(status);
    }
    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
}));

/**
 * GET /api/subs/earnings
 * Get sub's earnings summary
 */
router.get('/earnings', authenticate, isSub, asyncHandler(async (req, res) => {
    const stats = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
      (COUNT(*) FILTER (WHERE status = 'approved') * 10) as total_points_earned
    FROM place_submissions WHERE sub_id = $1
  `, [req.user.id]);

    res.json({
        success: true,
        data: {
            approvedCount: parseInt(stats.rows[0].approved_count),
            pendingCount: parseInt(stats.rows[0].pending_count),
            rejectedCount: parseInt(stats.rows[0].rejected_count),
            totalPointsEarned: parseInt(stats.rows[0].total_points_earned),
        },
    });
}));

module.exports = router;
