const webpush = require("web-push");
const PushSubscriptionModel = require("../models/pushSubscription.model");

// Configure web-push with VAPID keys
// This runs once when the module is imported
try {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} catch (error) {
    console.warn("VAPID details not configured properly, web push will fail:", error.message);
}

const PushService = {
    /**
     * sendToUser - Send a push notification to all devices for a given user
     * @param {number} userId - The ID of the recipient user
     * @param {Object} payload - An object { title, body, icon, url }
     */
    async sendToUser(userId, payload) {
        try {
            const subscriptions = await PushSubscriptionModel.findByUserId(userId);
            if (!subscriptions || subscriptions.length === 0) {
                return; // No active subscriptions for this user
            }

            const stringifiedPayload = JSON.stringify(payload);
            const sendPromises = subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                try {
                    await webpush.sendNotification(pushSubscription, stringifiedPayload);
                } catch (err) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // The subscription has expired or is no longer valid
                        console.log(`Push subscription ${sub.endpoint} is invalid, deleting...`);
                        await PushSubscriptionModel.deleteByEndpoint(sub.endpoint);
                    } else {
                        console.error("Failed to send push notification:", err);
                    }
                }
            });

            await Promise.allSettled(sendPromises);
        } catch (error) {
            console.error("Error in PushService.sendToUser:", error);
        }
    }
};

module.exports = PushService;
