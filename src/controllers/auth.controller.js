const { z } = require("zod");
const zxcvbn = require("zxcvbn");
const UAParser = require("ua-parser-js");
const { sql } = require("../db");
const UserModel = require("../models/user.model");
const AccountModel = require("../models/account.model");
const SessionModel = require("../models/session.model");
const AuditModel = require("../models/audit.model");
const PasswordHistoryModel = require("../models/password_history.model");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/token.util");
const { sendWelcomeEmail, sendLoginEmail } = require("../services/email.service");

// Validation Schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number"),
    name: z.string().min(2)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

/**
 * register - Register a new user
 */
async function userRegisterController(req, res) {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                status: "failed",
                message: "Validation Error",
                errors: validation.error.format()
            });
        }

        const { email, password, name } = validation.data;

        // Password strength check
        const strength = zxcvbn(password);
        if (strength.score < 3) {
            return res.status(400).json({
                status: "failed",
                message: "Password is too weak. Please use a stronger password.",
                feedback: strength.feedback.suggestions
            });
        }

        const userExist = await UserModel.findOne({ email });
        if (userExist) {
            return res.status(409).json({
                status: "failed",
                message: "User with this email already exists"
            });
        }

        const user = await UserModel.create({ email, password, name });
        
        // Add to password history
        await PasswordHistoryModel.add(user.id, user.password); // Using the hashed password from record

        // Create primary account
        const account = await AccountModel.create({ userId: user.id });

        // Audit Log
        await AuditModel.create({
            userId: user.id,
            action: 'registration',
            status: 'success',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        sendWelcomeEmail(user.email, user.name).catch(console.error);

        return res.status(201).json({
            status: "success",
            message: "User registered successfully, please login",
            user: {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Registration Controller Error:", error);
        return res.status(500).json({
            status: "failed",
            message: "Registration failed due to server error"
        });
    }
}

/**
 * login - Authenticate user and create session
 */
async function userLoginController(req, res) {
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const deviceStr = `${ua.browser.name || 'Unknown'} on ${ua.os.name || 'Unknown'} (${ua.device.type || 'desktop'})`;

    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ status: "failed", message: "Invalid input format" });
        }

        const { email, password } = validation.data;
        const user = await UserModel.findOne({ email });

        if (!user) {
            await AuditModel.create({ action: 'login', status: 'failure', ipAddress: req.ip, metadata: { email, reason: 'user_not_found' } });
            return res.status(401).json({ status: "failed", message: "Invalid email or password" });
        }

        // Check Lockout
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            await AuditModel.create({ userId: user.id, action: 'login', status: 'failure', ipAddress: req.ip, metadata: { reason: 'account_locked' } });
            return res.status(403).json({ 
                status: "failed", 
                message: `Account is temporarily locked. Please try again after ${new Date(user.lockout_until).toLocaleTimeString()}` 
            });
        }

        const isMatch = await UserModel.comparePassword(password, user.password);
        if (!isMatch) {
            await UserModel.incrementFailedLogin(user);
            await AuditModel.create({ userId: user.id, action: 'login', status: 'failure', ipAddress: req.ip, metadata: { reason: 'wrong_password' } });
            return res.status(401).json({ status: "failed", message: "Invalid email or password" });
        }

        // Success
        await UserModel.resetFailedLogin(user.id);
        await UserModel.updateLastLogin(user.id);

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user); // Initial session, no sessionId yet
        
        // Create DB session
        const session = await SessionModel.create({
            userId: user.id,
            refreshToken,
            ipAddress: req.ip,
            userAgent: deviceStr,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Regenerate refresh token with sessionId for rotation link
        const linkedRefreshToken = generateRefreshToken(user, session.id);
        await sql`UPDATE sessions SET refresh_token = ${linkedRefreshToken} WHERE id = ${session.id}`;

        await AuditModel.create({ userId: user.id, action: 'login', status: 'success', ipAddress: req.ip, userAgent: deviceStr });

        res.cookie("token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
        res.cookie("refreshToken", linkedRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/api/auth/refresh", sameSite: "lax" });

        sendLoginEmail(user.email, user.name).catch(console.error);

        return res.status(200).json({
            status: "success",
            message: "Logged in successfully",
            user: { id: user.id, uuid: user.uuid, name: user.name, email: user.email, role: user.role },
            accessToken
        });

    } catch (error) {
        console.error("Login Controller Error:", error);
        return res.status(500).json({ status: "failed", message: "Login failed" });
    }
}

/**
 * refresh - Refresh access token using refresh token
 */
async function refreshTokenController(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ status: "failed", message: "No refresh token" });

    try {
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) return res.status(401).json({ status: "failed", message: "Invalid refresh token" });

        const session = await SessionModel.findByToken(refreshToken);
        if (!session) {
            // Potential refresh token reuse/theft
            await AuditModel.create({ userId: decoded.userId, action: 'refresh_token', status: 'denied', ipAddress: req.ip, metadata: { reason: 'session_not_found_or_revoked' } });
            return res.status(401).json({ status: "failed", message: "Session revoked or expired" });
        }

        const user = await UserModel.findById(decoded.userId);
        if (!user) return res.status(401).json({ status: "failed", message: "User no longer exists" });

        // Rotate Refresh Token
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user, session.id);

        await sql`UPDATE sessions SET refresh_token = ${newRefreshToken}, last_active = NOW() WHERE id = ${session.id}`;

        res.cookie("token", newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/api/auth/refresh", sameSite: "lax" });

        return res.status(200).json({ status: "success", accessToken: newAccessToken });
    } catch (error) {
        console.error("Refresh Error:", error);
        return res.status(500).json({ status: "failed", message: "Token refresh failed" });
    }
}

/**
 * logout - Revoke current session
 */
async function userLogoutController(req, res) {
    const refreshToken = req.cookies.refreshToken;
    try {
        if (refreshToken) {
            const session = await SessionModel.findByToken(refreshToken);
            if (session) await SessionModel.revoke(session.id);
        }

        res.clearCookie("token");
        res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

        return res.status(200).json({ status: "success", message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ status: "failed", message: "Logout failed" });
    }
}

/**
 * logoutAll - Revoke all sessions for the user
 */
async function logoutAllController(req, res) {
    try {
        await SessionModel.revokeAllForUser(req.user.id);
        
        await AuditModel.create({ 
            userId: req.user.id, 
            action: 'logout_all', 
            status: 'success', 
            ipAddress: req.ip 
        });

        res.clearCookie("token");
        res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

        return res.status(200).json({ status: "success", message: "Logged out from all devices" });
    } catch (error) {
        return res.status(500).json({ status: "failed", message: "Logout all failed" });
    }
}

module.exports = { 
    userRegisterController, 
    userLoginController, 
    userLogoutController,
    refreshTokenController,
    logoutAllController
};