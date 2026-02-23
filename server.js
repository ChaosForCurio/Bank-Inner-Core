require("dotenv").config()

const { verifyConnection } = require("./src/db")
const app = require("./src/app")

const PORT = process.env.PORT || 5000

async function start() {
    try {
        await verifyConnection()
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`)
        })
    } catch (error) {
        console.error("Failed to start server:", error.message)
        process.exit(1)
    }
}

start()
