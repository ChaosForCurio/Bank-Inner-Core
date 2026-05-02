const { z } = require("zod");
const zxcvbn = require("zxcvbn");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const { sql } = require("../db");
const UserModel = require("../models/user.model");
const AccountModel = require("../models/account.model");
const SessionModel = require("../models/session.model");
const AuditModel = require("../models/audit.model");
const PasswordHistoryModel = require("../models/password_history.model");
const LoginHistoryModel = require("../models/loginHistory.model");
const UserOtpModel = require("../models/userOtp.model");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyResetToken } = require("../utils/token.util");
const { sendWelcomeEmail, sendLoginEmail, sendSecurityAlertEmail } = require("../services/email.service");
const { sendOTP } = require("../services/sms.service");
const NotificationService = require("../services/notification.service");


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

const verifyOtpSchema = z.object({
    userId: z.number(),
    otpCode: z.string().length(6)
});

const enableMfaSchema = z.object({
    phoneNumber: z.string().min(10)
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
 * login - Authenticate user and create session or request MFA
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

        // Success - Check for MFA
        if (user.mfa_enabled && user.phone_number) {
            // Generate OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await UserOtpModel.create(user.id, otpCode);
            
            // Send SMS
            await sendOTP(user.phone_number, otpCode);
            
            return res.status(200).json({
                status: "pending_mfa",
                message: "OTP sent to your registered phone number.",
                userId: user.id
            });
        }

        // No MFA required, proceed to complete login
        return await completeLoginFlow(user, req, res, deviceStr);

    } catch (error) {
        console.error("Login Controller Error:", error);
        return res.status(500).json({ status: "failed", message: "Login failed" });
    }
}

/**
 * verifyOTP - Validate OTP and complete login
 */
async function verifyOTPController(req, res) {
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const deviceStr = `${ua.browser.name || 'Unknown'} on ${ua.os.name || 'Unknown'} (${ua.device.type || 'desktop'})`;

    try {
        const validation = verifyOtpSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ status: "failed", message: "Invalid input format" });
        }

        const { userId, otpCode } = validation.data;
        
        const validOtp = await UserOtpModel.findValid(userId, otpCode);
        if (!validOtp) {
            await AuditModel.create({ userId, action: 'mfa_verify', status: 'failure', ipAddress: req.ip, metadata: { reason: 'invalid_or_expired_otp' } });
            return res.status(401).json({ status: "failed", message: "Invalid or expired OTP" });
        }

        // OTP valid, delete it and proceed
        await UserOtpModel.deleteForUser(userId);
        
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(401).json({ status: "failed", message: "User not found" });
        }

        return await completeLoginFlow(user, req, res, deviceStr);
    } catch (error) {
        console.error("Verify OTP Error:", error);
        return res.status(500).json({ status: "failed", message: "OTP verification failed" });
    }
}

/**
 * Helper function to complete login (tokens, session, alerts)
 */
async function completeLoginFlow(user, req, res, deviceStr) {
    await UserModel.resetFailedLogin(user.id);
    await UserModel.updateLastLogin(user.id);

    // --- Location & Device Fingerprinting ---
    let ipAddress = req.ip || req.connection.remoteAddress;
    
    // Handle local IP addresses mapping for geoip-lite
    let city = "Local Environment";
    let country = "Local";
    
    if (ipAddress !== '127.0.0.1' && ipAddress !== '::1' && ipAddress !== '::ffff:127.0.0.1') {
        const geo = geoip.lookup(ipAddress);
        if (geo) {
            city = geo.city || "Unknown City";
            country = geo.country || "Unknown Country";
        } else {
            city = "Unknown City";
            country = "Unknown Country";
        }
    } else {
        ipAddress = "127.0.0.1"; // standardize local IP
    }

    const locationStr = `${city}, ${country}`;

    // Get recent logins to compare
    const recentLogins = await LoginHistoryModel.getRecentLogins(user.id, 5);
    
    // Save this login
    await LoginHistoryModel.create({
        userId: user.id,
        ipAddress,
        deviceString: deviceStr,
        city,
        country
    });

    // Check if device or location is new
    const isNewDeviceOrLocation = recentLogins.length > 0 && !recentLogins.some(
        login => login.device_string === deviceStr && login.city === city && login.country === country
    );

    if (isNewDeviceOrLocation) {
        sendSecurityAlertEmail(user.email, user.name, deviceStr, locationStr, ipAddress).catch(console.error);
        NotificationService.notify(user.id, "Security Alert", `New login detected from ${deviceStr} in ${locationStr}`, "security", "/dashboard/security");
    } else {
        // Regular login email if not new device/location
        sendLoginEmail(user.email, user.name).catch(console.error);
        NotificationService.notify(user.id, "New Login", `You logged in from ${deviceStr}`, "info");
    }

    // ------------------------------------------

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

    return res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        user: { id: user.id, uuid: user.uuid, name: user.name, email: user.email, role: user.role, mfa_enabled: user.mfa_enabled },
        accessToken
    });
}


/**
 * enableMfa - Allow an authenticated user to enable SMS MFA
 */
async function enableMfaController(req, res) {
    try {
        const validation = enableMfaSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ status: "failed", message: "Invalid phone number format" });
        }

        const { phoneNumber } = validation.data;
        const userId = req.user.id;

        // Update user record
        await sql`UPDATE users SET phone_number = ${phoneNumber}, mfa_enabled = true WHERE id = ${userId}`;
        
        await AuditModel.create({ userId, action: 'enable_mfa', status: 'success', ipAddress: req.ip });

        return res.status(200).json({
            status: "success",
            message: "Two-Factor Authentication enabled successfully"
        });
    } catch (error) {
        console.error("Enable MFA Error:", error);
        return res.status(500).json({ status: "failed", message: "Failed to enable MFA" });
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

/**
 * resetPassword - Reset password using a valid passkey-issued reset token
 */
async function resetPasswordController(req, res) {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ status: "failed", message: "Reset token and new password are required" });
        }

        // Verify the reset token
        const decoded = verifyResetToken(resetToken);
        if (!decoded) {
            return res.status(401).json({ status: "failed", message: "Invalid or expired reset token" });
        }

        const user = await UserModel.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ status: "failed", message: "User not found" });
        }

        // Password strength check
        const strength = zxcvbn(newPassword);
        if (strength.score < 3) {
            return res.status(400).json({
                status: "failed",
                message: "Password is too weak. Please use a stronger password.",
                feedback: strength.feedback.suggestions
            });
        }

        // Check password history
        const isReused = await PasswordHistoryModel.isPasswordReused(user.id, newPassword);
        if (isReused) {
            return res.status(400).json({
                status: "failed",
                message: "You cannot reuse a recent password. Please choose a different password."
            });
        }

        // Hash and update the password
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${user.id}`;

        // Add to password history
        await PasswordHistoryModel.add(user.id, hashedPassword);

        // Audit log
        await AuditModel.create({
            userId: user.id,
            action: "password_reset",
            status: "success",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            metadata: { method: "passkey" }
        });

        return res.status(200).json({ status: "success", message: "Password reset successfully. You can now log in with your new password." });

    } catch (error) {
        console.error("Reset Password Controller Error:", error);
        return res.status(500).json({ status: "failed", message: "Password reset failed due to server error" });
    }
}

module.exports = { 
    userRegisterController, 
    userLoginController, 
    userLogoutController,
    refreshTokenController,
    logoutAllController,
    resetPasswordController,
    verifyOTPController,
    enableMfaController
};