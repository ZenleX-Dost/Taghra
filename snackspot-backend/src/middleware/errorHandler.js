// TAGHRA - Error Handler Middleware
// Centralized error handling

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Create common errors
 */
const createError = {
    badRequest: (message = 'Bad request', details = null) =>
        new ApiError(400, message, details),

    unauthorized: (message = 'Unauthorized') =>
        new ApiError(401, message),

    forbidden: (message = 'Forbidden') =>
        new ApiError(403, message),

    notFound: (message = 'Resource not found') =>
        new ApiError(404, message),

    conflict: (message = 'Resource already exists') =>
        new ApiError(409, message),

    tooManyRequests: (message = 'Too many requests') =>
        new ApiError(429, message),

    internal: (message = 'Internal server error') =>
        new ApiError(500, message),
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });

    // Handle known operational errors
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details,
        });
    }

    // Handle validation errors (express-validator)
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.array(),
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
        });
    }

    // Handle PostgreSQL errors
    if (err.code) {
        // Unique violation
        if (err.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Resource already exists',
            });
        }

        // Foreign key violation
        if (err.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Related resource not found',
            });
        }
    }

    // Default to internal server error
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error',
    });
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    ApiError,
    createError,
    errorHandler,
    asyncHandler,
};
