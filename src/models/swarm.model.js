const { sql } = require("../db");

const SwarmModel = {
    async createCampaign({ userId, title, targetAmount, currency = 'INR', merchantDetails, expiresAt }) {
        const rows = await sql`
            INSERT INTO swarm_campaigns (user_id, title, target_amount, currency, merchant_details, status, expires_at)
            VALUES (${userId}, ${title}, ${targetAmount}, ${currency}, ${merchantDetails}, 'funding', ${expiresAt})
            RETURNING *
        `;
        return rows[0];
    },

    async addParticipant({ swarmId, participantEmail, amountDue }) {
        const rows = await sql`
            INSERT INTO swarm_participants (swarm_id, participant_email, amount_due, status)
            VALUES (${swarmId}, ${participantEmail}, ${amountDue}, 'pending')
            RETURNING *
        `;
        return rows[0];
    },

    async getCampaign(id) {
        const rows = await sql`
            SELECT s.*, u.email as creator_email, u.name as creator_name
            FROM swarm_campaigns s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ${id}
        `;
        if (!rows.length) return null;

        const participants = await sql`
            SELECT * FROM swarm_participants WHERE swarm_id = ${id}
        `;
        rows[0].participants = participants;
        return rows[0];
    },

    async updateParticipantPayment(participantId, amountPaid) {
        const rows = await sql`
            UPDATE swarm_participants
            SET amount_paid = amount_paid + ${amountPaid},
                status = CASE WHEN amount_paid + ${amountPaid} >= amount_due THEN 'paid' ELSE 'pending' END
            WHERE id = ${participantId}
            RETURNING *
        `;
        return rows[0];
    },

    async updateCampaignStatus(swarmId, status) {
        const rows = await sql`
            UPDATE swarm_campaigns SET status = ${status} WHERE id = ${swarmId} RETURNING *
        `;
        return rows[0];
    },

    async getExpiredFundingCampaigns() {
        const rows = await sql`
            SELECT * FROM swarm_campaigns 
            WHERE status = 'funding' AND expires_at <= CURRENT_TIMESTAMP
        `;
        return rows;
    }
};

module.exports = SwarmModel;
