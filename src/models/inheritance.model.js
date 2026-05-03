const { sql } = require("../db");

const InheritanceModel = {
    async getByUser(userId) {
        const rows = await sql`
            SELECT * FROM inheritance_configs 
            WHERE user_id = ${userId}
        `;
        return rows[0];
    },

    async upsert({ userId, beneficiaryId, triggerMonths }) {
        const rows = await sql`
            INSERT INTO inheritance_configs (user_id, beneficiary_id, trigger_months, status, escalation_stage, updated_at)
            VALUES (${userId}, ${beneficiaryId}, ${triggerMonths}, 'active', 0, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                beneficiary_id = EXCLUDED.beneficiary_id,
                trigger_months = EXCLUDED.trigger_months,
                status = 'active',
                escalation_stage = 0,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        return rows[0];
    },

    async updateStatus(id, status, escalationStage) {
        const rows = await sql`
            UPDATE inheritance_configs 
            SET status = ${status}, 
                escalation_stage = ${escalationStage}, 
                last_contacted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0];
    },

    async logAction(userId, action, details = "") {
        await sql`
            INSERT INTO inheritance_logs (user_id, action, details)
            VALUES (${userId}, ${action}, ${details})
        `;
    },

    async getActiveTriggers() {
        // Find configs where user's last_login is older than trigger_months
        // and status is not 'executed' or 'cancelled'
        const rows = await sql`
            SELECT i.*, u.email, u.last_login, u.name as user_name,
                   b.name as beneficiary_name, b.email as beneficiary_email, b.account_number as beneficiary_account
            FROM inheritance_configs i
            JOIN users u ON i.user_id = u.id
            JOIN beneficiaries b ON i.beneficiary_id = b.id
            WHERE i.status IN ('active', 'escalating')
            AND (u.last_login IS NULL OR u.last_login < CURRENT_TIMESTAMP - (i.trigger_months * interval '1 month'))
        `;
        return rows;
    }
};

module.exports = InheritanceModel;
