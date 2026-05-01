const { sql } = require('../db');

const BeneficiaryModel = {
    async create({ userId, name, accountNumber, bankName, category }) {
        const rows = await sql`
            INSERT INTO beneficiaries (user_id, name, account_number, bank_name, category)
            VALUES (${userId}, ${name}, ${accountNumber}, ${bankName || 'Xieriee Core'}, ${category || 'General'})
            RETURNING *
        `;
        return rows[0];
    },

    async findByUserId(userId) {
        const rows = await sql`
            SELECT * FROM beneficiaries WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return rows;
    },

    async findById(id) {
        const rows = await sql`
            SELECT * FROM beneficiaries WHERE id = ${id}
        `;
        return rows[0];
    },

    async delete(id, userId) {
        const rows = await sql`
            DELETE FROM beneficiaries WHERE id = ${id} AND user_id = ${userId} RETURNING *
        `;
        return rows[0];
    }
};

module.exports = BeneficiaryModel;
