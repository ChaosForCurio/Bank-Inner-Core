const Redis = require("ioredis");
const env = require("./env.config");

// Create a single shared connection for caching and generic tasks
const redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisClient.on("error", (err) => {
    console.error("Redis Connection Error:", err);
});

redisClient.on("connect", () => {
    console.log("Connected to Redis successfully.");
});

// Helper to create new connections (needed for BullMQ and Socket.io)
const createRedisConnection = () => {
    return new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false
    });
};

module.exports = {
    redisClient,
    createRedisConnection
};
