const { neon } = require("@neondatabase/serverless")

async function connectDB() {
    try {
        const sql = neon(process.env.DATABASE_URL)
        // Verify connectivity
        await sql`SELECT 1`
        console.log("Database connected successfully")
    } catch (error) {
        console.error("Database connection failed:", error)
        process.exit(1)
    }
}

module.exports = connectDB
