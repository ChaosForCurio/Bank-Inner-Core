const env = require("./src/config/env.config")
const dns = require("dns")

// Force IPv4 resolution to prevent connection timeouts with cloud databases in Node 17+
dns.setDefaultResultOrder('ipv4first')

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
