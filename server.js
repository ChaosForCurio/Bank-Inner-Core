const env = require("./src/config/env.config")
const dns = require("dns")

// Force IPv4 resolution to prevent connection timeouts with cloud databases in Node 17+
dns.setDefaultResultOrder('ipv4first')

// Prevent ioredis 'Connection is closed' from crashing the server when Redis
// is unavailable. After the retry limit is reached, ioredis flushes its command
// queue with a thrown error. We catch it here so the rest of the app keeps running.
process.on('uncaughtException', (err) => {
    if (err.message && err.message.includes('Connection is closed')) {
        console.warn('[Redis] Connection closed after max retries. Redis-dependent features (queues, sockets) will be unavailable until Redis comes back online.');
        return; // Suppress — do not crash
    }
    // Re-throw anything else (real unhandled errors should still crash)
    console.error('[Server] Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    if (reason && reason.message && reason.message.includes('Connection is closed')) {
        console.warn('[Redis] Unhandled rejection: Redis connection closed.');
        return;
    }
    console.error('[Server] Unhandled Rejection:', reason);
});

const { verifyConnection } = require("./src/db")
const app = require("./src/app")

const PORT = env.PORT || 3000

async function startServer() {
    try {
        await verifyConnection()
        
        // Start background scheduler
        const SchedulerService = require("./src/services/scheduler.service");
        SchedulerService.start();
        
        // Start Queue workers
        const QueueService = require("./src/services/queue.service");
        QueueService.startWorkers();

        const SocketService = require("./src/services/socket.service");
        const http = require("http");
        const server = http.createServer(app);
        
        SocketService.init(server);

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Server started. Running on http://0.0.0.0:${PORT}`)
        })
    } catch (error) {
        console.error(`Server failed to start:`, error.message)
        process.exit(1)
    }
}

startServer()
