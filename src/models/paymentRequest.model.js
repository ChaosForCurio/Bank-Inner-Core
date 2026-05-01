const { sql } = require("../db");

const PaymentRequestModel = {
    /**
     * Create a new payment request
     */
    async create({ requestorId, token, amount, currency, note, expiresAt }) {
        try {
            const requests = await sql`
                INSERT INTO payment_requests (requestor_id, token, amount, currency, note, expires_at)
                VALUES (${requestorId}, ${token}, ${amount}, ${currency}, ${note}, ${expiresAt})
                RETURNING *
            `;
            return requests[0];
        } catch (error) {
            console.error("Error in PaymentRequestModel.create:", error);
            throw error;
        }
    },

    /**
     * Find payment request by token
     */
    async findByToken(token) {
        try {
            const requests = await sql`
                SELECT pr.*, u.name as requestor_name
                FROM payment_requests pr
                JOIN users u ON pr.requestor_id = u.id
                WHERE pr.token = ${token}
                LIMIT 1
            `;
            return requests.length > 0 ? requests[0] : null;
        } catch (error) {
            console.error("Error in PaymentRequestModel.findByToken:", error);
            throw error;
        }
    },

    /**
     * Update payment request status
     */
    async updateStatus(id, status) {
        try {
            const requests = await sql`
                UPDATE payment_requests
                SET status = ${status}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;
            return requests[0];
        } catch (error) {
            console.error("Error in PaymentRequestModel.updateStatus:", error);
            throw error;
        }
    }
};

module.exports = PaymentRequestModel;
