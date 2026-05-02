const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const WebhookController = require("../controllers/webhook.controller");

const webhookRoutes = Router();

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Register a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, events]
 *             properties:
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Webhook registered
 */
webhookRoutes.post("/", authMiddleware.authMiddleware, WebhookController.register);

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: List my webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhooks
 */
webhookRoutes.get("/", authMiddleware.authMiddleware, WebhookController.list);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Webhook deleted
 */
webhookRoutes.delete("/:id", authMiddleware.authMiddleware, WebhookController.delete);

module.exports = webhookRoutes;
