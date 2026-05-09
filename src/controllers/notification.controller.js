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

<<<<<<< HEAD
            return res.status(200).json({
                success: true,
                message: "Notification(s) updated"
            });
        } catch (error) {
            console.error("Mark as read error:", error);
            return res.status(500).json({ message: "Failed to update notifications" });
        }
    },

    /**
     * sendNotification - Allow frontend to trigger a notification for the current user
     */
    async sendNotification(req, res) {
        const userId = req.user.id;
        const { title, message, type, url } = req.body;
        const NotificationService = require("../services/notification.service");

        try {
            await NotificationService.notify(userId, title, message, type, url);
            return res.status(201).json({
                success: true,
                message: "Notification sent"
            });
        } catch (error) {
            console.error("Send notification error:", error);
            return res.status(500).json({ message: "Failed to send notification" });
        }
    },

    /**
     * createNotification - Internal utility to create notifications
     */
    async createInternal(userId, title, message, type = 'info') {
        try {
            await sql`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (${userId}, ${title}, ${message}, ${type})
            `;
        } catch (error) {
            console.error("Internal notification creation error:", error);
        }
    },

    /**
     * getVapidPublicKey - Return the public key for frontend generic subscription
     */
    async getVapidPublicKey(req, res) {
=======
>>>>>>> e4f8b24e3e2299031686f4ca80c2b0442b8400a1
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

        // --- Business Logic for Actions ---
        if (action === 'confirm_life') {
            const InheritanceModel = require("../models/inheritance.model");
            // Find the inheritance config for this user and reset it
            const config = await InheritanceModel.getByUser(userId);
            if (config) {
                await InheritanceModel.updateStatus(config.id, 'active', 0);
                await InheritanceModel.logAction(userId, "RESET_VIA_NOTIFICATION", "User confirmed activity via push notification");
                console.log(`[Inheritance] Protocol reset for user ${userId} via notification action.`);
            }
        }
        
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


