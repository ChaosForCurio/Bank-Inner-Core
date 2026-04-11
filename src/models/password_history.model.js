const { sql } = require("../db");
const bcrypt = require("bcryptjs");

const PasswordHistoryModel = {
    /**
     * add - Add a new password hash to history
     */
    async add(userId, hashedPassword) {
        try {
            await sql`
                INSERT INTO password_history (user_id, password_hash)
                VALUES (${userId}, ${hashedPassword})
            `;
            
            // Cleanup: Keep only the last 5 passwords
            await sql`
                DELETE FROM password_history 
                WHERE id IN (
                    SELECT id FROM password_history 
                    WHERE user_id = ${userId} 
                    ORDER BY created_at DESC 
                    OFFSET 5
                )
            `;
        } catch (error) {
            console.error("Error in PasswordHistoryModel.add:", error);
            throw error;
        }
    },

    /**
     * isPasswordReused - Check if new password matches any previous password
     */
    async isPasswordReused(userId, newPassword) {
        try {
            const history = await sql`
                SELECT password_hash FROM password_history 
                WHERE user_id = ${userId} 
                ORDER BY created_at DESC
            `;
            
            for (const entry of history) {
                const match = await bcrypt.compare(newPassword, entry.password_hash);
                if (match) return true;
            }
            
            return false;
        } catch (error) {
            console.error("Error in PasswordHistoryModel.isPasswordReused:", error);
            throw error;
        }
    }
};

module.exports = PasswordHistoryModel;
