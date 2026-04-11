const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "access_secret_123";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_123";

/**
 * generateAccessToken - Create a short-lived access token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            role: user.role || 'user',
            uuid: user.uuid
        }, 
        ACCESS_TOKEN_SECRET, 
        { expiresIn: "15m" }
    );
};

/**
 * generateRefreshToken - Create a long-lived refresh token
 */
const generateRefreshToken = (user, sessionId) => {
    return jwt.sign(
        { 
            userId: user.id, 
            sessionId: sessionId 
        }, 
        REFRESH_TOKEN_SECRET, 
        { expiresIn: "7d" }
    );
};

/**
 * verifyAccessToken - Validate an access token
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * verifyRefreshToken - Validate a refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
