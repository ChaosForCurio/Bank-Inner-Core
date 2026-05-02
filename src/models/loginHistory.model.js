const { sql } = require("../db");

const LoginHistoryModel = {
    /**
     * create - Create a new login history record
     * @param {Object} params
     * @param {number} params.userId - The ID of the user
     * @param {string} params.ipAddress - The IP address of the user
     * @param {string} params.deviceString - The parsed user-agent string
     * @param {string} params.city - The city of the login
     * @param {string} params.country - The country of the login
     */
    async create({ userId, ipAddress, deviceString = null, city = null, country = null }) {
        try {
            const result = await sql`
                INSERT INTO login_history (user_id, ip_address, device_string, city, country)
                VALUES (${userId}, ${ipAddress}, ${deviceString}, ${city}, ${country})
                RETURNING *
            `;
            return result[0];
        } catch (error) {
            console.error("Error in LoginHistoryModel.create:", error);
            throw error;
        }
    },

    /**
     * getRecentLogins - Get recent logins for a user
     * @param {number} userId - The ID of the user
     * @param {number} limit - The number of records to return
     */
    async getRecentLogins(userId, limit = 5) {
        try {
            const result = await sql`
                SELECT * FROM login_history
                WHERE user_id = ${userId}
                ORDER BY login_time DESC
                LIMIT ${limit}
            `;
            return result;
        } catch (error) {
            console.error("Error in LoginHistoryModel.getRecentLogins:", error);
            throw error;
        }
    }
};

module.exports = LoginHistoryModel;
