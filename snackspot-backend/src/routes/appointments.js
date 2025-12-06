// SnackSpot - Appointments Routes
// Booking appointments with doctors/vets

const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/appointments/book
 * Book an appointment
 */
router.post('/book',
    authenticate,
    [
        body('doctorId').notEmpty().isUUID(),
        body('date').isDate(),
        body('timeSlot').notEmpty(),
        body('reason').optional().trim().isLength({ max: 500 }),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw createError.badRequest('Validation failed', errors.array());
        }

        const { doctorId, date, timeSlot, reason } = req.body;
        const userId = req.user.id;

        // Check if slot is available
        const slotCheck = await db.query(`
      SELECT id FROM doctor_availability
      WHERE doctor_id = $1 AND date = $2 AND time_slot = $3 AND is_booked = false
    `, [doctorId, date, timeSlot]);

        if (slotCheck.rows.length === 0) {
            throw createError.conflict('Time slot not available');
        }

        // Get doctor info
        const doctor = await db.query(`
      SELECT p.name, d.consultation_fee FROM places p
      JOIN doctors d ON p.id = d.place_id
      WHERE p.id = $1
    `, [doctorId]);

        if (doctor.rows.length === 0) {
            throw createError.notFound('Doctor not found');
        }

        // Create appointment
        const appointmentId = uuidv4();
        await db.query(`
      INSERT INTO appointments (id, user_id, doctor_id, date, time_slot, reason, fee, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
    `, [appointmentId, userId, doctorId, date, timeSlot, reason, doctor.rows[0].consultation_fee]);

        // Mark slot as booked
        await db.query(`
      UPDATE doctor_availability SET is_booked = true
      WHERE doctor_id = $1 AND date = $2 AND time_slot = $3
    `, [doctorId, date, timeSlot]);

        // Award points
        await db.query('UPDATE users SET points = points + 5 WHERE id = $1', [userId]);

        res.status(201).json({
            success: true,
            message: 'Appointment booked',
            data: {
                id: appointmentId,
                doctorName: doctor.rows[0].name,
                date,
                timeSlot,
                fee: parseFloat(doctor.rows[0].consultation_fee),
                status: 'confirmed',
            },
            pointsEarned: 5,
        });
    })
);

/**
 * GET /api/appointments/my-appointments
 * Get user's appointments
 */
router.get('/my-appointments', authenticate, asyncHandler(async (req, res) => {
    const { status, upcoming } = req.query;

    let query = `
    SELECT a.id, a.date, a.time_slot, a.reason, a.fee, a.status, a.created_at,
      p.id as doctor_id, p.name as doctor_name, d.specialty
    FROM appointments a
    JOIN places p ON a.doctor_id = p.id
    JOIN doctors d ON p.id = d.place_id
    WHERE a.user_id = $1
  `;
    const params = [req.user.id];

    if (status) {
        query += ` AND a.status = $${params.length + 1}`;
        params.push(status);
    }

    if (upcoming === 'true') {
        query += ` AND a.date >= CURRENT_DATE`;
    }

    query += ` ORDER BY a.date DESC, a.time_slot`;

    const result = await db.query(query, params);

    res.json({
        success: true,
        data: result.rows.map(a => ({
            id: a.id,
            date: a.date,
            timeSlot: a.time_slot,
            reason: a.reason,
            fee: parseFloat(a.fee),
            status: a.status,
            doctor: { id: a.doctor_id, name: a.doctor_name, specialty: a.specialty },
            createdAt: a.created_at,
        })),
    });
}));

/**
 * PUT /api/appointments/:id/cancel
 * Cancel an appointment
 */
router.put('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    const { reason } = req.body;

    // Get appointment details
    const apt = await db.query(`
    SELECT doctor_id, date, time_slot FROM appointments
    WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
  `, [req.params.id, req.user.id]);

    if (apt.rows.length === 0) {
        throw createError.badRequest('Appointment cannot be cancelled');
    }

    // Cancel appointment
    await db.query(`
    UPDATE appointments SET status = 'cancelled', cancellation_reason = $1
    WHERE id = $2
  `, [reason, req.params.id]);

    // Free up time slot
    await db.query(`
    UPDATE doctor_availability SET is_booked = false
    WHERE doctor_id = $1 AND date = $2 AND time_slot = $3
  `, [apt.rows[0].doctor_id, apt.rows[0].date, apt.rows[0].time_slot]);

    res.json({ success: true, message: 'Appointment cancelled' });
}));

module.exports = router;
