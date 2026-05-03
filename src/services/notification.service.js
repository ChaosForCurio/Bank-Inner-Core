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
            if (settings.in_app_enabled) {
                await sql`
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES (${userId}, ${title}, ${message}, ${type})
                `;
            }

            // 3. Real-time Delivery via Sockets
            SocketService.emitToUser(userId, "notification", {
                title,
                message,
                type,
                metadata,
                timestamp: new Date()
            });

            // 4. Multi-channel Dispatch
            const dispatchPromises = [];

            // Web Push
            if (settings.push_enabled) {
                dispatchPromises.push(
                    PushService.sendToUser(userId, {
                        title,
                        body: message,
                        url: metadata.url || '/dashboard'
                    }).catch(err => console.error("Push failed:", err.message))
                );
            }

            // Email
            if (settings.email_enabled) {
                // Determine which email template to use based on type
                if (type === 'transaction' && metadata.amount) {
                    dispatchPromises.push(
                        EmailService.sendTransactionEmail(user.email, user.name, metadata.transactionId, metadata.amount, metadata.type)
                    );
                } else if (type === 'security') {
                    dispatchPromises.push(
                        EmailService.sendSecurityAlertEmail(user.email, user.name, metadata.device, metadata.location, metadata.ip)
                    );
                } else {
                    dispatchPromises.push(
                        EmailService.sendBroadcastEmail(user.email, user.name, message, title)
                    );
                }
            }

            // SMS (High priority or explicit enabled)
            if (settings.sms_enabled || (type === 'security' && user.phone)) {
                if (type === 'transaction' && metadata.amount) {
                    dispatchPromises.push(SmsService.sendTransactionAlert(user.phone, metadata.amount, 'Processed'));
                } else if (type === 'security') {
                    dispatchPromises.push(SmsService.sendSecurityAlert(user.phone, metadata.location || 'New Login'));
                } else {
                    dispatchPromises.push(SmsService.sendSms(user.phone, `${title}: ${message}`));
                }
            }

            await Promise.allSettled(dispatchPromises);
            console.log(`Unified notification dispatched to user ${userId}: ${title}`);

        } catch (error) {
            console.error("NotificationService.notify error:", error);
        }
    }
};

module.exports = NotificationService;

