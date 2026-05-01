const cluster = require("cluster")
const os = require("os")
const env = require("./src/config/env.config")
const dns = require("dns")

// Force IPv4 resolution to prevent connection timeouts with cloud databases in Node 17+
dns.setDefaultResultOrder('ipv4first')

const { verifyConnection } = require("./src/db")
const app = require("./src/app")

const PORT = env.PORT
const NUM_CPUS = os.cpus().length

async function startWorker() {
    try {
        await verifyConnection()
        
        // Start background scheduler
        const SchedulerService = require("./src/services/scheduler.service");
        SchedulerService.start();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Worker ${process.pid} started. Server running on http://0.0.0.0:${PORT}`)
        })
    } catch (error) {
        console.error(`Worker ${process.pid} failed to start:`, error.message)
        process.exit(1)
    }
}

if (cluster.isPrimary && env.NODE_ENV === "production") {
    console.log(`Primary ${process.pid} is running. Spawning ${NUM_CPUS} workers...`)

    // Fork workers.
    for (let i = 0; i < NUM_CPUS; i++) {
        cluster.fork()
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Spawning a replacement...`)
        cluster.fork()
    })
} else {
    // Workers or Development mode (single process)
    if (env.NODE_ENV !== "production") {
        console.log("Running in development mode. Skipping clustering.")
    }
    startWorker()
}

