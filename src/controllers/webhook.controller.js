const WebhookModel = require("../models/webhook.model");

const WebhookController = {
    /**
     * register - Create a new webhook
     */
    async register(req, res) {
        const { url, events } = req.body;
        const userId = req.user.id;

        if (!url || !events || !Array.isArray(events)) {
            return res.status(400).json({ message: "URL and events array are required" });
        }

        try {
            const webhook = await WebhookModel.create({ userId, url, events });
            res.status(201).json({
                status: "success",
                message: "Webhook registered successfully. Save the secret for verification.",
                webhook
            });
        } catch (error) {
            console.error("Webhook registration error:", error);
            res.status(500).json({ message: "Failed to register webhook" });
        }
    },

    /**
     * list - Get user's webhooks
     */
    async list(req, res) {
        try {
            const webhooks = await WebhookModel.findByUserId(req.user.id);
            res.json({ status: "success", webhooks });
        } catch (error) {
            res.status(500).json({ message: "Failed to list webhooks" });
        }
    },

    /**
     * delete - Remove a webhook
     */
    async delete(req, res) {
        try {
            const success = await WebhookModel.delete(req.params.id, req.user.id);
            if (!success) return res.status(404).json({ message: "Webhook not found" });
            res.json({ status: "success", message: "Webhook deleted" });
        } catch (error) {
            res.status(500).json({ message: "Failed to delete webhook" });
        }
    }
};

module.exports = WebhookController;
