const WebhookModel = require("../models/webhook.model");
const QueueService = require("./queue.service");

const WebhookService = {
    /**
     * trigger - Main entry point for system events
     */
    async trigger(eventType, payload) {
        try {
            const webhooks = await WebhookModel.findByEvent(eventType);
            
            if (webhooks.length === 0) return;

            console.log(`Triggering ${eventType} for ${webhooks.length} webhooks`);

            const deliveryPromises = webhooks.map(webhook => QueueService.addWebhookJob(webhook, eventType, payload));
            await Promise.allSettled(deliveryPromises);
        } catch (error) {
            console.error("WebhookService.trigger error:", error);
        }
    }
};

module.exports = WebhookService;
