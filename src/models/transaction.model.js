const { sql } = require("../db");

const TransactionModel = {
    /**
     * create - Create a new transaction
     */
    async create({ fromAccount, toAccount, amount, type, idempotencyKey, status = 'pending', category = 'Other' }) {
        try {
            const transactions = await sql`
                INSERT INTO transactions (from_account, to_account, amount, type, idempotency_key, status, category)
                VALUES (${fromAccount}, ${toAccount}, ${amount}, ${type}, ${idempotencyKey}, ${status}, ${category})
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
    },

    /**
     * findByAccountWithPagination - Find transactions for an account with pagination
     */
    async findByAccountWithPagination(accountId, limit = 50, cursor = null) {
        try {
            let transactions;
            
            if (cursor) {
                // Assuming cursor is the ID or created_at of the last seen item
                transactions = await sql`
                    SELECT * FROM transactions 
                    WHERE (from_account = ${accountId} OR to_account = ${accountId})
                    AND created_at < (SELECT created_at FROM transactions WHERE id = ${cursor})
                    ORDER BY created_at DESC, id DESC
                    LIMIT ${limit}
                `;
            } else {
                transactions = await sql`
                    SELECT * FROM transactions 
                    WHERE from_account = ${accountId} OR to_account = ${accountId}
                    ORDER BY created_at DESC, id DESC
                    LIMIT ${limit}
                `;
            }
            
            return transactions;
        } catch (error) {
            console.error("Error in TransactionModel.findByAccountWithPagination:", error);
            throw error;
        }
    }
};

module.exports = TransactionModel;
