const { neon } = require("@neondatabase/serverless")

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables")
}

const sql = neon(process.env.DATABASE_URL)

async function verifyConnection(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Verifying Neon connection (Attempt ${i + 1}/${retries})...`)
            await sql`SELECT 1`
            console.log("Database connected successfully")
            return
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message)
            if (i === retries - 1) {
                console.error("All connection attempts failed!")
                console.error("Error Detail:", error)
                process.exit(1)
            }
            console.log("Waiting 5 seconds before retry...")
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }
}

module.exports = { sql, verifyConnection }
