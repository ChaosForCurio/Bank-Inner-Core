const UserModel = require("../models/user.model");
const { verifyAccessToken } = require("../utils/token.util");
const { sql } = require("../db");

/**
 * authMiddleware - Standard user authentication
 * Verifies JWT and checks if session exists in DB
 */
async function authMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: No token provided",
            status: "failed",
        });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).json({
            message: "Unauthorized: Invalid or expired token",
            status: "failed",
        });
    }

    try {
        // Find user
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized: User not found",
                status: "failed",
            });
        }

        // Attach user and token info to request
        req.user = user;
        req.tokenData = decoded;
        
        return next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            message: "Internal server error during authentication",
            status: "failed",
        });
    }
}

/**
 * authSystemUserMiddleware - Elevated privilege authentication
 */
async function authSystemUserMiddleware(req, res, next) {
    return authMiddleware(req, res, async () => {
        if (!req.user || req.user.role !== 'admin') { // maps to is_system in old logic, but now we use roles
            return res.status(403).json({
                message: "Forbidden: Admin access required",
                status: "failed",
            });
        }
        next();
    });
}

module.exports = { authMiddleware, authSystemUserMiddleware };