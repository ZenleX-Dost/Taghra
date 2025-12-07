// Taghra - Admin Routes
// Administrative document guide

const express = require('express');
const db = require('../config/database');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/admin/search
 * Search administrative documents
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { query } = req.query;

  const result = await db.query(`
    SELECT id, name, description, category, required_documents, fees, processing_time
    FROM admin_documents
    WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
    ORDER BY name
    LIMIT 20
  `, [`%${query}%`]);

  res.json({ success: true, data: result.rows });
}));

/**
 * GET /api/admin/documents
 * Get all document categories
 */
router.get('/documents', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT id, name, description, category, fees, processing_time
    FROM admin_documents
    ORDER BY category, name
  `);

  // Group by category
  const grouped = result.rows.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  res.json({ success: true, data: grouped });
}));

/**
 * GET /api/admin/:id
 * Get document details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT * FROM admin_documents WHERE id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) {
    throw createError.notFound('Document not found');
  }

  res.json({ success: true, data: result.rows[0] });
}));

module.exports = router;
