const { sql } = require("../db");
const NotificationSettingsModel = require("../models/notificationSettings.model");


/**
 * getSettings - Fetch notification settings for the authenticated user
 */
async function getSettings(req, res) {
    try {
        const userId = req.user.id;
        const settings = await NotificationSettingsModel.findByUserId(userId);
        
        return res.status(200).json({
            status: "success",
            data: settings
        });
    } catch (error) {
        console.error("Error fetching notification settings:", error);
        return res.status(500).json({
            status: "failed",
            message: "Failed to fetch notification settings"
        });
    }
}

/**
 * updateSettings - Update notification settings for the authenticated user
 */
async function updateSettings(req, res) {
    try {
        const userId = req.user.id;
        const updates = req.body;

        // Prevent updating user_id or other sensitive fields if any
        delete updates.user_id;
        delete updates.updated_at;

        await NotificationSettingsModel.update(userId, updates);
        const updatedSettings = await NotificationSettingsModel.findByUserId(userId);

        return res.status(200).json({
            status: "success",
            message: "Notification settings updated successfully",
            data: updatedSettings
        });
    } catch (error) {
        console.error("Error updating notification settings:", error);
        return res.status(500).json({
            status: "failed",
            message: "Failed to update notification settings"
        });
    }
}

/**
 * getNotifications - Fetch in-app notifications for the authenticated user
 */
async function getNotifications(req, res) {
    try {
        const userId = req.user.id;
        const notifications = await sql`
            SELECT * FROM notifications 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        
        return res.status(200).json({
            status: "success",
            data: notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            status: "failed",
            message: "Failed to fetch notifications"
        });
    }
}

/**
 * markAsRead - Mark a specific notification as read
 */
async function markAsRead(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await sql`
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        return res.status(200).json({
            status: "success",
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            status: "failed",
            message: "Failed to update notification"
        });
    }
}

/**
 * acknowledgeDelivery - Mark a notification as delivered (via WebPush or Frontend)
 */
async function acknowledgeDelivery(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await sql`
            UPDATE notifications 
            SET is_delivered = TRUE, delivered_at = CURRENT_TIMESTAMP 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        return res.status(200).json({
            status: "success",
            message: "Delivery acknowledged"
        });
    } catch (error) {
        console.error("Error acknowledging delivery:", error);
        return res.status(500).json({
            status: "failed",
            message: "Failed to acknowledge delivery"
        });
    }
}

/**
 * handleAction - Handle a notification action (e.g., Approve/Decline)
 */
async function handleAction(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { action, metadata } = req.body;

        console.log(`Notification action received for ${id}: ${action}`, metadata);

        // Here you would implement business logic for actions
        // Example: if (action === 'approve') { await TransactionService.approve(...) }
        
        // Mark as read and acknowledged
        await sql`
            UPDATE notifications 
            SET is_read = TRUE, is_delivered = TRUE, delivered_at = CURRENT_TIMESTAMP 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        return res.status(200).json({
            status: "success",
            message: `Action ${action} processed successfully`
        });
    } catch (error) {
        console.error("Error handling notification action:", error);
        return res.status(500).json({
            status: "failed",
            message: "Failed to process action"
        });
    }
}

module.exports = {
    getSettings,
    updateSettings,
    getNotifications,
    markAsRead,
    acknowledgeDelivery,
    handleAction
};


