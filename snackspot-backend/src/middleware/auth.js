// TAGHRA - Authentication Middleware
// JWT token verification and user extraction

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
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

        // Get user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, points, created_at')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            throw createError.unauthorized('User not found');
        }

        // Attach user to request
        req.user = user;
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

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, points')
            .eq('id', decoded.userId)
            .single();

        if (!error && user) {
            req.user = user;
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
