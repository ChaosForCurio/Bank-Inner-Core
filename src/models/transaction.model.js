const { sql } = require("../db");

const TransactionModel = {
    /**
     * create - Create a new transaction
     */
    async create({ fromAccount, toAccount, amount, type, idempotencyKey, status = 'pending' }) {
        try {
            const transactions = await sql`
                INSERT INTO transactions (from_account, to_account, amount, type, idempotency_key, status)
                VALUES (${fromAccount}, ${toAccount}, ${amount}, ${type}, ${idempotencyKey}, ${status})
                RETURNING *
            `;
            return transactions[0];
        } catch (error) {
            console.error("Error in TransactionModel.create:", error);
            throw error;
        }
    },

    /**
     * findById - Find transaction by ID
     */
    async findById(id) {
        try {
            const transactions = await sql`
                SELECT * FROM transactions WHERE id = ${id} LIMIT 1
            `;
            return transactions.length > 0 ? transactions[0] : null;
        } catch (error) {
            console.error("Error in TransactionModel.findById:", error);
            throw error;
        }
    },

    /**
     * updateStatus - Update transaction status
     */
    async updateStatus(id, status) {
        try {
            const transactions = await sql`
                UPDATE transactions 
                SET status = ${status}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;
            return transactions[0];
        } catch (error) {
            console.error("Error in TransactionModel.updateStatus:", error);
            throw error;
        }
    }
};

module.exports = TransactionModel;
