const { sql } = require("../db");
const PushService = require("./push.service");
const EmailService = require("./email.service");
const SmsService = require("./sms.service");
const SocketService = require("./socket.service");
const UserModel = require("../models/user.model");
const NotificationSettingsModel = require("../models/notificationSettings.model");

/**
 * NotificationService
 * Orchestrates multi-channel delivery (Email, SMS, Push, Sockets).
 */
const NotificationService = {
    /**
     * notify - Send a unified notification across all preferred channels
     * @param {number} userId - The recipient user ID
     * @param {string} title - The notification title
     * @param {string} message - The notification message
     * @param {string} type - 'info' | 'transaction' | 'security' | 'alert'
     * @param {Object} metadata - Optional metadata (amount, transactionId, etc.)
     */
    async notify(userId, title, message, type = 'info', metadata = {}) {
        try {
            // 1. Fetch user data and settings
            const [user, settings] = await Promise.all([
                UserModel.findById(userId),
                NotificationSettingsModel.findByUserId(userId)
            ]);

            if (!user) {
                console.warn(`Cannot send notification: User ${userId} not found.`);
                return;
            }

            // 2. Save to Database (In-App Notification)
            let notificationId;
            if (settings.in_app_enabled) {
                const result = await sql`
                    INSERT INTO notifications (user_id, title, message, type, requires_fallback)
                    VALUES (${userId}, ${title}, ${message}, ${type}, ${type === 'security'})
                    RETURNING id
                `;
                notificationId = result[0].id;
            }

            // 3. Real-time Delivery via Sockets
            SocketService.emitToUser(userId, "notification", {
                id: notificationId,
                title,
                message,
                type,
                metadata,
                timestamp: new Date()
            });

            // 4. Multi-channel Dispatch
            const dispatchPromises = [];

            // Web Push (with support for actions)
            if (settings.push_enabled) {
                const pushPayload = {
                    title,
                    body: message,
                    url: metadata.url || '/dashboard',
                    tag: `notification-${notificationId}`,
                    data: { notificationId, ...metadata }
                };

                // Add Actions if provided in metadata (e.g., Approve/Decline)
                if (metadata.actions) {
                    pushPayload.actions = metadata.actions;
                }

                dispatchPromises.push(
                    PushService.sendToUser(userId, pushPayload)
                        .catch(err => console.error("Push failed:", err.message))
                );
            }

            // Email (Standard logic)
            if (settings.email_enabled) {
                if (type === 'transaction' && metadata.amount) {
                    dispatchPromises.push(EmailService.sendTransactionEmail(user.email, user.name, metadata.transactionId, metadata.amount, metadata.type));
                } else if (type === 'security') {
                    dispatchPromises.push(EmailService.sendSecurityAlertEmail(user.email, user.name, metadata.device, metadata.location, metadata.ip));
                } else {
                    dispatchPromises.push(EmailService.sendBroadcastEmail(user.email, user.name, message, title));
                }
            }

            // SMS (Immediate if security, otherwise wait for fallback)
            if (settings.sms_enabled || (type === 'security' && user.phone)) {
                // For security, we send SMS immediately AND set up a fallback if needed
                // For now, let's send it immediately for high-priority
                if (type === 'security' || type === 'critical') {
                    dispatchPromises.push(this.dispatchSms(user, title, message, type, metadata));
                }
            }

            await Promise.allSettled(dispatchPromises);

            // 5. OMNICHANNEL FALLBACK LOGIC
            // If it's a security alert and requires fallback, schedule a check in 2 minutes
            if (type === 'security' && notificationId) {
                this.scheduleFallback(userId, notificationId, title, message, metadata);
            }

            console.log(`Unified notification dispatched to user ${userId}: ${title}`);

        } catch (error) {
            console.error("NotificationService.notify error:", error);
        }
    },

    /**
     * dispatchSms - Helper to send SMS via SmsService
     */
    async dispatchSms(user, title, message, type, metadata) {
        if (!user.phone) return;
        if (type === 'transaction' && metadata.amount) {
            return SmsService.sendTransactionAlert(user.phone, metadata.amount, 'Processed');
        } else if (type === 'security') {
            return SmsService.sendSecurityAlert(user.phone, metadata.location || 'New Login');
        } else {
            return SmsService.sendSms(user.phone, `${title}: ${message}`);
        }
    },

    /**
     * scheduleFallback - Schedules a check to send SMS if push/in-app not acknowledged
     */
    scheduleFallback(userId, notificationId, title, message, metadata) {
        const FALLBACK_DELAY = 2 * 60 * 1000; // 2 minutes

        setTimeout(async () => {
            try {
                // Check if notification has been "delivered" or acknowledged
                const result = await sql`
                    SELECT is_delivered, fallback_sent FROM notifications 
                    WHERE id = ${notificationId}
                `;

                if (result.length > 0 && !result[0].is_delivered && !result[0].fallback_sent) {
                    console.log(`Fallback triggered for notification ${notificationId} (User ${userId})`);
                    
                    const user = await UserModel.findById(userId);
                    if (user && user.phone) {
                        await this.dispatchSms(user, `FALLBACK: ${title}`, message, 'security', metadata);
                        
                        // Mark fallback as sent
                        await sql`UPDATE notifications SET fallback_sent = TRUE WHERE id = ${notificationId}`;
                    }
                }
            } catch (error) {
                console.error("Error in scheduleFallback check:", error);
            }
        }, FALLBACK_DELAY);
    }
};


module.exports = NotificationService;

