const { sql } = require("../db");
const PushService = require("./push.service");

/**
 * NotificationService
 * Orchestrates database storage and push notification delivery.
 */
const NotificationService = {
    /**
     * notify - Send an in-app and push notification to a user
     * @param {number} userId - The recipient user ID
     * @param {string} title - The notification title
     * @param {string} message - The notification message
     * @param {string} type - 'info' | 'transaction' | 'security' | 'alert'
     * @param {string} url - Optional redirect URL for the frontend
     */
    async notify(userId, title, message, type = 'info', url = '/dashboard') {
        try {
            // 1. Save to Database for the UI bell
            await sql`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (${userId}, ${title}, ${message}, ${type})
            `;
            console.log(`Notification saved to DB for user ${userId}: ${title}`);

            // 2. Dispatch Push Notification (non-blocking)
            PushService.sendToUser(userId, {
                title,
                body: message,
                url
            }).catch(err => console.error(`Push dispatch failed for user ${userId}:`, err.message));

        } catch (error) {
            console.error("NotificationService.notify error:", error);
        }
    }
};

module.exports = NotificationService;
