const { neon } = require("@neondatabase/serverless")

async function connectDB() {
    try {
        const sql = neon(process.env.DATABASE_URL)
        console.log("Checking database connection...")
        // Simple query to verify connection
        await sql`SELECT 1`
        console.log("Database connected successfully")
    } catch (error) {
        console.error("Database connection failed:", error.message)
        // Log more details if it's a timeout
        if (error.message.includes("timeout")) {
            console.error("Hint: Ensure your network allows connections to Neon and check your DATABASE_URL.")
        }
        process.exit(1)
    }
}

module.exports = connectDB
