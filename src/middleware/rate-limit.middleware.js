const rateLimit = require("express-rate-limit");

/**
 * authRateLimiter - Limiter for authentication routes (login, register)
 * Protects against brute-force attacks
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: {
        status: "failed",
        message: "Too many attempts from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * apiRateLimiter - Generic limiter for other API routes
 */
const apiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per window
    message: {
        status: "failed",
        message: "Too many requests, please slow down",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authRateLimiter,
    apiRateLimiter
};
