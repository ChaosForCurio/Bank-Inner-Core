const { sql } = require("../db");
const crypto = require("crypto");

const WebhookModel = {
    /**
     * create - Register a new webhook
     */
    async create({ userId, url, events }) {
        const secret = crypto.randomBytes(32).toString("hex");
        try {
            const webhooks = await sql`
                INSERT INTO webhooks (user_id, url, secret, events)
                VALUES (${userId}, ${url}, ${events})
                RETURNING id, url, events, status, created_at
            `;
            return { ...webhooks[0], secret }; // Secret is only shown once or stored hashed? Here we show it for initial setup.
        } catch (error) {
            console.error("Error in WebhookModel.create:", error);
            throw error;
        }
    },

    /**
     * findByUserId - List webhooks for a user
     */
    async findByUserId(userId) {
        try {
            return await sql`
                SELECT id, url, events, status, created_at 
                FROM webhooks 
                WHERE user_id = ${userId}
            `;
        } catch (error) {
            console.error("Error in WebhookModel.findByUserId:", error);
            throw error;
        }
    },

    /**
     * findByEvent - Find all active webhooks subscribed to a specific event
     */
    async findByEvent(eventType) {
        try {
            return await sql`
                SELECT * FROM webhooks 
                WHERE status = 'active' AND ${eventType} = ANY(events)
            `;
        } catch (error) {
            console.error("Error in WebhookModel.findByEvent:", error);
            throw error;
        }
    },

    /**
     * logDelivery - Record a delivery attempt
     */
    async logDelivery({ webhookId, eventType, payload, responseStatus, responseBody, status }) {
        try {
            await sql`
                INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body, status)
                VALUES (${webhookId}, ${eventType}, ${JSON.stringify(payload)}, ${responseStatus}, ${responseBody}, ${status})
            `;
        } catch (error) {
            console.error("Error in WebhookModel.logDelivery:", error);
        }
    },

    /**
     * delete - Remove a webhook
     */
    async delete(id, userId) {
        try {
            const result = await sql`
                DELETE FROM webhooks WHERE id = ${id} AND user_id = ${userId} RETURNING id
            `;
            return result.length > 0;
        } catch (error) {
            console.error("Error in WebhookModel.delete:", error);
            throw error;
        }
    }
};

module.exports = WebhookModel;
