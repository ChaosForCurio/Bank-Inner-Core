const { sql } = require("../db");

const AccountModel = {
    /**
     * create - Create a new account
     * @param {Object} param0 
     * @param {string} param0.userId 
     * @param {string} param0.status 
     * @param {string} param0.currency 
     */
    async create({ userId, status = "active", currency = "INR" }) {
        try {
            const accounts = await sql`
                INSERT INTO accounts (user_id, status, currency)
                VALUES (${userId}, ${status}, ${currency})
                RETURNING *
            `;
            return accounts[0];
        } catch (error) {
            console.error("Error in AccountModel.create:", error);
            throw error;
        }
    },

    /**
     * findByUserId - Find accounts by user ID
     * @param {string} userId 
     */
    async findByUserId(userId) {
        try {
            const accounts = await sql`
                SELECT * FROM accounts 
                WHERE user_id = ${userId}
            `;
            return accounts;
        } catch (error) {
            console.error("Error in AccountModel.findByUserId:", error);
            throw error;


        }
    }
};

module.exports = AccountModel;