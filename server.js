require("dotenv").config()

const { verifyConnection } = require("./src/db")
const app = require("./src/app")

async function start() {
    try {
        await verifyConnection()
        app.listen(3000, () => {
            console.log("Server is running on http://localhost:3000")
        })
    } catch (error) {
        console.error("Failed to start server:", error.message)
        process.exit(1)
    }
}

start()
