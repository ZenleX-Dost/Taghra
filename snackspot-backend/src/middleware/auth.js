// SnackSpot - Authentication Middleware
// JWT token verification and user extraction

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { createError } = require('./errorHandler');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await db.query(
            'SELECT id, email, full_name, role, points, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            throw createError.unauthorized('User not found');
        }

        // Attach user to request
        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(createError.unauthorized('Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(createError.unauthorized('Token expired'));
        }
        next(error);
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await db.query(
            'SELECT id, email, full_name, role, points FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
};

/**
 * Check if user has required role
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError.unauthorized('Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(createError.forbidden('Insufficient permissions'));
        }

        next();
    };
};

/**
 * Check if user is a Sub (ambassador)
 */
const isSub = (req, res, next) => {
    if (!req.user || req.user.role !== 'sub') {
        return next(createError.forbidden('Ambassador access required'));
    }
    next();
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return next(createError.forbidden('Admin access required'));
    }
    next();
};

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    isSub,
    isAdmin,
};
