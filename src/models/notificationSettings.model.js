const { sql } = require("../db");

const NotificationSettingsModel = {
    async findByUserId(userId) {
        try {
            const settings = await sql`SELECT * FROM notification_settings WHERE user_id = ${userId} LIMIT 1`;
            if (settings.length === 0) {
                // Return default settings if none exist
                return {
                    user_id: userId,
                    email_enabled: true,
                    sms_enabled: false,
                    push_enabled: true,
                    in_app_enabled: true,
                    transaction_alerts: true,
                    security_alerts: true
                };
            }
            return settings[0];
        } catch (error) {
            console.error("Error in NotificationSettingsModel.findByUserId:", error);
            return null;
        }
    },

    async update(userId, updates) {
        try {
            const fields = Object.keys(updates);
            if (fields.length === 0) return;

            // Simple update for common fields
            if (updates.email_enabled !== undefined) await sql`UPDATE notification_settings SET email_enabled = ${updates.email_enabled} WHERE user_id = ${userId}`;
            if (updates.sms_enabled !== undefined) await sql`UPDATE notification_settings SET sms_enabled = ${updates.sms_enabled} WHERE user_id = ${userId}`;
            if (updates.push_enabled !== undefined) await sql`UPDATE notification_settings SET push_enabled = ${updates.push_enabled} WHERE user_id = ${userId}`;
            if (updates.in_app_enabled !== undefined) await sql`UPDATE notification_settings SET in_app_enabled = ${updates.in_app_enabled} WHERE user_id = ${userId}`;
            if (updates.transaction_alerts !== undefined) await sql`UPDATE notification_settings SET transaction_alerts = ${updates.transaction_alerts} WHERE user_id = ${userId}`;
            if (updates.security_alerts !== undefined) await sql`UPDATE notification_settings SET security_alerts = ${updates.security_alerts} WHERE user_id = ${userId}`;
            
            await sql`UPDATE notification_settings SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
        } catch (error) {
            console.error("Error in NotificationSettingsModel.update:", error);
            throw error;
        }
    },

    async createDefault(userId) {
        try {
            await sql`
                INSERT INTO notification_settings (user_id)
                VALUES (${userId})
                ON CONFLICT (user_id) DO NOTHING
            `;
        } catch (error) {
            console.error("Error creating default notification settings:", error);
        }
    }
};

module.exports = NotificationSettingsModel;
