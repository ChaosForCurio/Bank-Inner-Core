const { sql } = require("../db");
const ledgerModel = require("./ledger.model");

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
    },

    /**
     * findById - Find account by ID
     * @param {string} id 
     */
    async findById(id) {
        try {
            const accounts = await sql`
                SELECT * FROM accounts 
                WHERE id = ${id}
            `;
            return accounts[0];
        } catch (error) {
            console.error("Error in AccountModel.findById:", error);
            throw error;
        }
    },

    /**
     * updateBalance - Update account balance
     * @param {string} id 
     * @param {number} amount 
     */
    async updateBalance(id, amount) {
        try {
            const accounts = await sql`
                UPDATE accounts 
                SET balance = balance + ${amount}
                WHERE id = ${id}
                RETURNING *
            `;
            return accounts[0];
        } catch (error) {
            console.error("Error in AccountModel.updateBalance:", error);
            throw error;
        }
    },

    /**
     * findPrimaryByUserId - Find the primary account for a user
     * @param {string} userId 
     */
    async findPrimaryByUserId(userId) {
        try {
            const accounts = await sql`
                SELECT * FROM accounts 
                WHERE user_id = ${userId}
                ORDER BY created_at ASC
                LIMIT 1
            `;
            return accounts[0];
        } catch (error) {
            console.error("Error in AccountModel.findPrimaryByUserId:", error);
            throw error;
        }
    }
};

module.exports = AccountModel;