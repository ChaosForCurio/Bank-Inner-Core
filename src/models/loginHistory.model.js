const { sql } = require("../db");

const LoginHistoryModel = {
    /**
     * create - Create a new login history record
     * @param {Object} params
     * @param {number} params.userId - The ID of the user
     * @param {string} params.ipAddress - The IP address of the user
     */
    async create({ userId, ipAddress }) {
        try {
            const result = await sql`
                INSERT INTO login_history (user_id, ip_address)
                VALUES (${userId}, ${ipAddress})
                RETURNING *
            `;
            return result[0];
        } catch (error) {
            console.error("Error in LoginHistoryModel.create:", error);
            throw error;
        }
    }
};

module.exports = LoginHistoryModel;
