// Taghra - Rate Limiter Middleware
// Prevents abuse by limiting request rates

const rateLimit = {};

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
const rateLimiter = (req, res, next) => {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

    // Get client identifier (IP or user ID if authenticated)
    const clientId = req.user?.id || req.ip;
    const now = Date.now();

    // Initialize or get client rate limit data
    if (!rateLimit[clientId]) {
        rateLimit[clientId] = {
            count: 0,
            startTime: now,
        };
    }

    const clientData = rateLimit[clientId];

    // Reset if window has passed
    if (now - clientData.startTime > windowMs) {
        clientData.count = 0;
        clientData.startTime = now;
    }

    // Check rate limit
    if (clientData.count >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((clientData.startTime + windowMs - now) / 1000),
        });
    }

    // Increment count
    clientData.count++;

    // Add rate limit headers
    res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': maxRequests - clientData.count,
        'X-RateLimit-Reset': new Date(clientData.startTime + windowMs).toISOString(),
    });

    next();
};

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

    for (const [clientId, data] of Object.entries(rateLimit)) {
        if (now - data.startTime > windowMs * 2) {
            delete rateLimit[clientId];
        }
    }
}, 60000); // Every minute

module.exports = { rateLimiter };
