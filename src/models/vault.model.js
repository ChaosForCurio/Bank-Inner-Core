const { sql } = require('../db');

const VaultModel = {
    async create({ userId, name, targetAmount, emoji, color }) {
        const rows = await sql`
            INSERT INTO vaults (user_id, name, target_amount, emoji, color)
            VALUES (${userId}, ${name}, ${targetAmount}, ${emoji}, ${color})
            RETURNING *
        `;
        return rows[0];
    },

    async findByUserId(userId) {
        const rows = await sql`
            SELECT * FROM vaults WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return rows;
    },

    async findById(vaultId) {
        const rows = await sql`
            SELECT * FROM vaults WHERE id = ${vaultId}
        `;
        return rows[0];
    },

    async updateBalance(vaultId, amount) {
        const rows = await sql`
            UPDATE vaults 
            SET current_amount = current_amount + ${amount}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${vaultId}
            RETURNING *
        `;
        return rows[0];
    },

    async delete(vaultId, userId) {
        const rows = await sql`
            DELETE FROM vaults WHERE id = ${vaultId} AND user_id = ${userId} RETURNING *
        `;
        return rows[0];
    }
};

module.exports = VaultModel;
