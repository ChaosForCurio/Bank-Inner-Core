const { sql } = require("../db");
const crypto = require("crypto");

const TransactionModel = {
    /**
     * create - Create a new transaction with cryptographic chaining
     */
    async create({ fromAccount, toAccount, amount, type, idempotencyKey, status = 'pending', category = 'Other' }) {
        try {
            // Get the latest transaction hash for chaining
            const latest = await sql`
                SELECT hash FROM transactions 
                WHERE status = 'completed' 
                ORDER BY id DESC LIMIT 1
            `;
            
            const previousHash = latest.length > 0 ? latest[0].hash : "0".repeat(64);

            // Calculate hash for this transaction
            const dataToHash = `${previousHash}|${fromAccount}|${toAccount}|${amount}|${type}|${idempotencyKey}|${category}`;
            const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            const transactions = await sql`
                INSERT INTO transactions (
                    from_account, to_account, amount, type, 
                    idempotency_key, status, category, hash, previous_hash
                )
                VALUES (
                    ${fromAccount}, ${toAccount}, ${amount}, ${type}, 
                    ${idempotencyKey}, ${status}, ${category}, ${hash}, ${previousHash}
                )
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
     * verifyChain - Verify the integrity of the transaction chain for a range
     */
    async verifyChain(limit = 100) {
        const txs = await sql`
            SELECT id, hash, previous_hash, from_account, to_account, amount, type, idempotency_key, category 
            FROM transactions 
            WHERE status = 'completed'
            ORDER BY id DESC LIMIT ${limit}
        `;

        const errors = [];
        for (let i = 0; i < txs.length - 1; i++) {
            const current = txs[i];
            const next = txs[i + 1]; // next in DESC order is actually previous in timeline

            // Verify current hash
            const dataToHash = `${current.previous_hash}|${current.from_account}|${current.to_account}|${current.amount}|${current.type}|${current.idempotency_key}|${current.category}`;
            const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            if (calculatedHash !== current.hash) {
                errors.push({ id: current.id, error: "Hash mismatch" });
            }

            if (current.previous_hash !== next.hash) {
                errors.push({ id: current.id, error: "Chain broken: previous_hash does not match previous transaction hash" });
            }
        }
        return { verified: errors.length === 0, errors };
    }
};

module.exports = TransactionModel;

