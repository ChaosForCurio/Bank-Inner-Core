const { sql } = require("../db");

const UserOtpModel = {
    /**
     * Create a new OTP for a user
     */
    async create(userId, otpCode, validityMinutes = 5) {
        try {
            const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);
            
            // Invalidate any existing OTPs for this user
            await sql`DELETE FROM user_otps WHERE user_id = ${userId}`;
            
            const result = await sql`
                INSERT INTO user_otps (user_id, otp_code, expires_at)
                VALUES (${userId}, ${otpCode}, ${expiresAt})
                RETURNING id, user_id, otp_code, expires_at
            `;
            return result[0];
        } catch (error) {
            console.error("Error creating User OTP:", error);
            throw error;
        }
    },

    /**
     * Find a valid OTP
     */
    async findValid(userId, otpCode) {
        try {
            const result = await sql`
                SELECT * FROM user_otps 
                WHERE user_id = ${userId} 
                AND otp_code = ${otpCode} 
                AND expires_at > NOW()
                LIMIT 1
            `;
            return result[0] || null;
        } catch (error) {
            console.error("Error finding valid OTP:", error);
            throw error;
        }
    },

    /**
     * Delete OTPs for a user (after successful verification)
     */
    async deleteForUser(userId) {
        try {
            await sql`DELETE FROM user_otps WHERE user_id = ${userId}`;
        } catch (error) {
            console.error("Error deleting user OTPs:", error);
            throw error;
        }
    }
};

module.exports = UserOtpModel;
