// Taghra - Health Routes
// Doctors and veterinarians

const express = require('express');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/health/doctors
 * Get list of doctors with filters
 */
router.get('/doctors', asyncHandler(async (req, res) => {
    const { lat, lng, radius = 5000, specialty, available, limit = 20 } = req.query;

    let query = `
    SELECT p.id, p.name, p.address, p.phone, p.rating, p.review_count,
      d.specialty, d.consultation_fee, d.is_available,
      ST_Y(p.location::geometry) as latitude,
      ST_X(p.location::geometry) as longitude
  `;
    const params = [];

    if (lat && lng) {
        query += `, ST_Distance(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance`;
        params.push(lng, lat);
    }

    query += `
    FROM places p
    JOIN doctors d ON p.id = d.place_id
    WHERE p.category IN ('health', 'vet')
  `;

    if (lat && lng) {
        query += ` AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $${params.length + 1})`;
        params.push(radius);
    }

    if (specialty) {
        query += ` AND d.specialty = $${params.length + 1}`;
        params.push(specialty);
    }

    if (available !== undefined) {
        query += ` AND d.is_available = $${params.length + 1}`;
        params.push(available === 'true');
    }

    query += lat && lng ? ` ORDER BY distance LIMIT $${params.length + 1}` : ` ORDER BY p.rating DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
        success: true,
        data: result.rows.map(d => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty,
            address: d.address,
            phone: d.phone,
            rating: parseFloat(d.rating) || 0,
            reviewCount: d.review_count,
            consultationFee: parseFloat(d.consultation_fee),
            isAvailable: d.is_available,
            latitude: d.latitude,
            longitude: d.longitude,
            distance: d.distance ? Math.round(d.distance) : null,
        })),
    });
}));

/**
 * GET /api/health/doctors/:id
 * Get doctor details
 */
router.get('/doctors/:id', asyncHandler(async (req, res) => {
    const result = await db.query(`
    SELECT p.*, d.specialty, d.consultation_fee, d.is_available, d.education, d.experience_years,
      ST_Y(p.location::geometry) as latitude, ST_X(p.location::geometry) as longitude
    FROM places p
    JOIN doctors d ON p.id = d.place_id
    WHERE p.id = $1
  `, [req.params.id]);

    if (result.rows.length === 0) {
        throw createError.notFound('Doctor not found');
    }

    res.json({ success: true, data: result.rows[0] });
}));

/**
 * GET /api/health/doctors/:id/availability
 * Get doctor's available time slots
 */
router.get('/doctors/:id/availability', asyncHandler(async (req, res) => {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(`
    SELECT time_slot, is_booked
    FROM doctor_availability
    WHERE doctor_id = $1 AND date = $2
    ORDER BY time_slot
  `, [req.params.id, targetDate]);

    res.json({
        success: true,
        date: targetDate,
        slots: result.rows.map(s => ({
            time: s.time_slot,
            available: !s.is_booked,
        })),
    });
}));

/**
 * GET /api/health/specialties
 * Get list of medical specialties
 */
router.get('/specialties', asyncHandler(async (req, res) => {
    const result = await db.query(`
    SELECT DISTINCT specialty, COUNT(*) as doctor_count
    FROM doctors
    GROUP BY specialty
    ORDER BY specialty
  `);

    res.json({ success: true, data: result.rows });
}));

module.exports = router;
