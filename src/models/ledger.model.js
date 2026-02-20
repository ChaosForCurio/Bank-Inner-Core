const { sql } = require("../db");

const LedgerModel = {
    /**
     * create - Create a new ledger entry
     */
    async create({ accountId, transactionId, amount, type, balance, description = "" }) {
        try {
            const entries = await sql`
                INSERT INTO ledgers (account_id, transaction_id, amount, type, balance, description)
                VALUES (${accountId}, ${transactionId}, ${amount}, ${type}, ${balance}, ${description})
                RETURNING *
            `;
            return entries[0];
        } catch (error) {
            console.error("Error in LedgerModel.create:", error);
            throw error;
        }
    },

    /**
     * findByAccountId - Find ledger entries for an account
     */
    async findByAccountId(accountId) {
        try {
            const entries = await sql`
                SELECT * FROM ledgers WHERE account_id = ${accountId} ORDER BY created_at DESC
            `;
            return entries;
        } catch (error) {
            console.error("Error in LedgerModel.findByAccountId:", error);
            throw error;
        }
    }
};

module.exports = LedgerModel;
