const { sql } = require("../db");
const PushSubscriptionModel = require("../models/pushSubscription.model");

const NotificationController = {
    /**
     * getNotifications - Fetch user notifications
     */
    async getNotifications(req, res) {
        const userId = req.user.id;
        const { limit = 20, unreadOnly = false } = req.query;

        try {
            let notifications;
            if (unreadOnly === 'true') {
                notifications = await sql`
                    SELECT * FROM notifications 
                    WHERE user_id = ${userId} AND read_status = 'unread'
                    ORDER BY created_at DESC
                    LIMIT ${limit}
                `;
            } else {
                notifications = await sql`
                    SELECT * FROM notifications 
                    WHERE user_id = ${userId}
                    ORDER BY created_at DESC
                    LIMIT ${limit}
                `;
            }

            return res.status(200).json({
                success: true,
                notifications
            });
        } catch (error) {
            console.error("Get notifications error:", error);
            return res.status(500).json({ message: "Failed to retrieve notifications" });
        }
    },

    /**
     * markAsRead - Mark a single or all notifications as read
     */
    async markAsRead(req, res) {
        const userId = req.user.id;
        const { id } = req.params;

        try {
            if (id === 'all') {
                await sql`
                    UPDATE notifications 
                    SET read_status = 'read' 
                    WHERE user_id = ${userId} AND read_status = 'unread'
                `;
            } else {
                await sql`
                    UPDATE notifications 
                    SET read_status = 'read' 
                    WHERE id = ${id} AND user_id = ${userId}
                `;
            }

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
        return res.status(200).json({
            success: true,
            publicKey: process.env.VAPID_PUBLIC_KEY
        });
    },

    /**
     * subscribe - Save a new push subscription object
     */
    async subscribe(req, res) {
        try {
            const userId = req.user.id;
            const { subscription, deviceType } = req.body;

            if (!subscription || !subscription.endpoint || !subscription.keys) {
                return res.status(400).json({ message: "Invalid subscription object" });
            }

            await PushSubscriptionModel.create({
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                deviceType: deviceType || 'web'
            });

            return res.status(201).json({
                success: true,
                message: "Subscription saved successfully"
            });
        } catch (error) {
            console.error("Subscription save error:", error);
            return res.status(500).json({ message: "Failed to save subscription" });
        }
    }
};

module.exports = NotificationController;
