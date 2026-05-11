const Redis = require("ioredis");
const env = require("./env.config");

// Exponential backoff capped at 10s, max 10 attempts.
// Returning null stops ioredis from retrying further.
const retryStrategy = (times) => {
    if (times > 10) {
        console.error(`[Redis] Max reconnect attempts (10) reached. Giving up.`);
        return null;
    }
    const delay = Math.min(times * 200, 10000);
    console.warn(`[Redis] Reconnecting... attempt ${times}, waiting ${delay}ms`);
    return delay;
};

// Shared client used for caching/generic tasks.
// maxRetriesPerRequest: 0 ensures commands fail immediately (not queue forever)
// when Redis is unavailable, preventing the "Connection is closed" crash.
const redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 0,
    enableReadyCheck: false,
    retryStrategy,
    lazyConnect: true,
});

redisClient.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
        console.error("[Redis] Error:", err.message);
    }
});

redisClient.on("connect", () => {
    console.log("[Redis] Connected successfully.");
});

redisClient.on("close", () => {
    console.warn("[Redis] Connection closed.");
});

// BullMQ requires maxRetriesPerRequest: null — it manages its own job retry logic.
// Each created connection gets its own error handler to prevent Node.js from
// throwing an unhandled error event and crashing.
const createRedisConnection = () => {
    const client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        retryStrategy,
        lazyConnect: true,
    });

    client.on("error", (err) => {
        if (err.code !== "ECONNREFUSED") {
            console.error("[Redis:Worker] Error:", err.message);
        }
    });

    return client;
};

module.exports = {
    redisClient,
    createRedisConnection,
};
