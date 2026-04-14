const { v4: uuidv4 } = require("uuid");

/**
 * requestIdMiddleware - Adds a unique ID to each request
 * This helps correlate logs for a specific request across the application
 */
function requestIdMiddleware(req, res, next) {
    const requestId = req.headers["x-request-id"] || uuidv4();
    
    // Attach to request object
    req.id = requestId;
    
    // Set in response header for client-side correlation
    res.setHeader("X-Request-Id", requestId);
    
    next();
}

module.exports = requestIdMiddleware;
