require("dotenv").config()

const connectDB = require("./config/db")
const app = require("./src/app")

async function start() {
    try {
        await connectDB()
        app.listen(3000, () => {
            console.log("Server is running on port 3000")
        })
    } catch (err) {
        console.error("Failed to start server:", err)
        process.exit(1)
    }
}

start()
