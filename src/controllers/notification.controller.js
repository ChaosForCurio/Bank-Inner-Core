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

module.exports = {
    getSettings,
    updateSettings,
    getNotifications,
    markAsRead
};

