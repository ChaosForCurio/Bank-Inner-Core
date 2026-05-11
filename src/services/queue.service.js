const { Queue, Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redis.config");
const WebhookModel = require("../models/webhook.model");
const crypto = require("crypto");

// BullMQ connections are created lazily — only when startWorkers() is called.
// This prevents a crash-at-startup when Redis is unavailable.
let webhookQueue = null;

const getWebhookQueue = () => {
    if (!webhookQueue) {
        webhookQueue = new Queue("webhookQueue", {
            connection: createRedisConnection()
        });
    }
    return webhookQueue;
};

/**
 * QueueService
 * Handles distributed background jobs using BullMQ
 */
const QueueService = {
    /**
     * Add a webhook delivery job to the queue
     */
    async addWebhookJob(webhook, eventType, payload) {
        try {
            await getWebhookQueue().add("deliverWebhook", {
                webhook,
                eventType,
                payload
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                removeOnComplete: true,
                removeOnFail: false
            });
        } catch (err) {
            console.error("[QueueService] Failed to enqueue webhook job (Redis unavailable?):", err.message);
        }
    },

    /**
     * Start workers to process jobs.
     * Called once when the server starts — skips gracefully if Redis is down.
     */
    startWorkers() {
        console.log("Starting BullMQ Workers...");

        let webhookWorker;
        try {
            webhookWorker = new Worker("webhookQueue", async (job) => {
                const { webhook, eventType, payload } = job.data;
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
                        signal: AbortSignal.timeout(5000)
                    });

                    const responseText = await response.text();

                    await WebhookModel.logDelivery({
                        webhookId: webhook.id,
                        eventType,
                        payload,
                        responseStatus: response.status,
                        responseBody: responseText.slice(0, 1000),
                        status: response.ok ? "success" : "failed"
                    });

                    if (!response.ok) {
                        throw new Error(`Non-200 OK response from webhook: ${response.status}`);
                    }
                } catch (error) {
                    console.error(`Webhook worker failed for ${webhook.url}:`, error.message);

                    await WebhookModel.logDelivery({
                        webhookId: webhook.id,
                        eventType,
                        payload,
                        responseStatus: 0,
                        responseBody: error.message,
                        status: "failed"
                    });
                    // Throwing error allows BullMQ to retry the job
                    throw error;
                }
            }, {
                connection: createRedisConnection(),
                concurrency: 5
            });
        } catch (err) {
            console.warn("[QueueService] Could not start BullMQ worker (Redis unavailable?):", err.message);
            return;
        }

        webhookWorker.on('completed', (job) => {
            console.log(`Webhook job ${job.id} has completed!`);
        });

        webhookWorker.on('failed', (job, err) => {
            console.error(`Webhook job ${job?.id} has failed:`, err.message);
        });

        // Prevent unhandled error event crash on the worker's internal Redis client
        webhookWorker.on('error', (err) => {
            if (err.code !== 'ECONNREFUSED') {
                console.error('[QueueService:Worker] Error:', err.message);
            }
        });
    }
};

module.exports = QueueService;
