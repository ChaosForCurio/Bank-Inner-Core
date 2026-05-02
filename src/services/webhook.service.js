const crypto = require("crypto");
const WebhookModel = require("../models/webhook.model");

const WebhookService = {
    /**
     * trigger - Main entry point for system events
     */
    async trigger(eventType, payload) {
        try {
            const webhooks = await WebhookModel.findByEvent(eventType);
            
            if (webhooks.length === 0) return;

            console.log(`Triggering ${eventType} for ${webhooks.length} webhooks`);

            const deliveryPromises = webhooks.map(webhook => this.deliver(webhook, eventType, payload));
            await Promise.allSettled(deliveryPromises);
        } catch (error) {
            console.error("WebhookService.trigger error:", error);
        }
    },

    /**
     * deliver - Send the actual request with signature
     */
    async deliver(webhook, eventType, payload) {
        const timestamp = Date.now();
        const body = JSON.stringify({
            event: eventType,
            timestamp,
            data: payload
        });

        // Create HMAC signature
        const signature = crypto
            .createHmac("sha256", webhook.secret)
            .update(`${timestamp}.${body}`)
            .digest("hex");

        try {
            const response = await fetch(webhook.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Bank-Signature": signature,
                    "X-Bank-Timestamp": timestamp.toString(),
                    "User-Agent": "Bank-Inner-Core-Webhook/1.0"
                },
                body: body,
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            const responseText = await response.text();

            await WebhookModel.logDelivery({
                webhookId: webhook.id,
                eventType,
                payload,
                responseStatus: response.status,
                responseBody: responseText.slice(0, 1000), // Truncate long responses
                status: response.ok ? "success" : "failed"
            });

            return response.ok;
        } catch (error) {
            console.error(`Webhook delivery failed to ${webhook.url}:`, error.message);
            
            await WebhookModel.logDelivery({
                webhookId: webhook.id,
                eventType,
                payload,
                responseStatus: 0,
                responseBody: error.message,
                status: "failed"
            });

            return false;
        }
    }
};

module.exports = WebhookService;
