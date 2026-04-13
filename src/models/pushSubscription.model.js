const { sql } = require("../db");

const PushSubscriptionModel = {
    /**
     * create - Save a new push subscription
     */
    async create({ userId, endpoint, p256dh, auth, deviceType = 'web' }) {
        try {
            // Use ON CONFLICT DO UPDATE to handle duplicate endpoints or update re-subscriptions
            const subscriptions = await sql`
                INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, device_type)
                VALUES (${userId}, ${endpoint}, ${p256dh}, ${auth}, ${deviceType})
                ON CONFLICT (endpoint) 
                DO UPDATE SET 
                    user_id = EXCLUDED.user_id,
                    p256dh = EXCLUDED.p256dh, 
                    auth = EXCLUDED.auth,
                    device_type = EXCLUDED.device_type,
                    created_at = CURRENT_TIMESTAMP
                RETURNING *
            `;
            return subscriptions[0];
        } catch (error) {
            console.error("Error in PushSubscriptionModel.create:", error);
            throw error;
        }
    },

    /**
     * findByUserId - Get all active subscriptions for a user
     */
    async findByUserId(userId) {
        try {
            return await sql`SELECT * FROM push_subscriptions WHERE user_id = ${userId}`;
        } catch (error) {
            console.error("Error in PushSubscriptionModel.findByUserId:", error);
            throw error;
        }
    },

    /**
     * deleteByEndpoint - Remove an expired or invalid subscription
     */
    async deleteByEndpoint(endpoint) {
        try {
            await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
        } catch (error) {
            console.error("Error in PushSubscriptionModel.deleteByEndpoint:", error);
            throw error;
        }
    }
};

module.exports = PushSubscriptionModel;
