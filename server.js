const env = require("./src/config/env.config")
const dns = require("dns")
// Force IPv4 resolution to prevent connection timeouts with cloud databases in Node 17+
dns.setDefaultResultOrder('ipv4first')

const { verifyConnection } = require("./src/db")
const app = require("./src/app")

const PORT = env.PORT

async function start() {
    try {
        await verifyConnection()
        
        // Start background scheduler
        const SchedulerService = require("./src/services/scheduler.service");
        SchedulerService.start();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`)
        })
    } catch (error) {
        console.error("Failed to start server:", error.message)
        process.exit(1)
    }
}

start()
