const { sql } = require("../db");

const SessionModel = {
    /**
     * create - Register a new session
     */
    async create({ userId, refreshToken, ipAddress, userAgent, expiresAt }) {
        try {
            const sessions = await sql`
                INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
                VALUES (${userId}, ${refreshToken}, ${ipAddress}, ${userAgent}, ${expiresAt})
                RETURNING *
            `;
            return sessions[0];
        } catch (error) {
            console.error("Error in SessionModel.create:", error);
            throw error;
        }
    },

    /**
     * findByToken - Find session by refresh token
     */
    async findByToken(token) {
        try {
            const sessions = await sql`
                SELECT * FROM sessions 
                WHERE refresh_token = ${token} AND is_revoked = false AND expires_at > NOW()
                LIMIT 1
            `;
            return sessions[0] || null;
        } catch (error) {
            console.error("Error in SessionModel.findByToken:", error);
            throw error;
        }
    },

    /**
     * revoke - Revoke a specific session
     */
    async revoke(sessionId) {
        try {
            await sql`
                UPDATE sessions SET is_revoked = true 
                WHERE id = ${sessionId}
            `;
        } catch (error) {
            console.error("Error in SessionModel.revoke:", error);
            throw error;
        }
    },

    /**
     * revokeAllForUser - Revoke all active sessions for a user
     */
    async revokeAllForUser(userId, exceptSessionId = null) {
        try {
            if (exceptSessionId) {
                await sql`
                    UPDATE sessions SET is_revoked = true 
                    WHERE user_id = ${userId} AND id != ${exceptSessionId}
                `;
            } else {
                await sql`
                    UPDATE sessions SET is_revoked = true 
                    WHERE user_id = ${userId}
                `;
            }
        } catch (error) {
            console.error("Error in SessionModel.revokeAllForUser:", error);
            throw error;
        }
    },

    /**
     * listActiveForUser - Get all active sessions for a user
     */
    async listActiveForUser(userId) {
        try {
            return await sql`
                SELECT id, ip_address, user_agent, last_active, created_at 
                FROM sessions 
                WHERE user_id = ${userId} AND is_revoked = false AND expires_at > NOW()
                ORDER BY last_active DESC
            `;
        } catch (error) {
            console.error("Error in SessionModel.listActiveForUser:", error);
            throw error;
        }
    }
};

module.exports = SessionModel;
