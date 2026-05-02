require("dotenv").config();
const { sql } = require("../../src/db");

async function migrateUserOtps() {
    try {
        console.log("Creating user_otps table...");
        
        await sql`
            CREATE TABLE IF NOT EXISTS user_otps (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                otp_code VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        console.log("Migration successful: user_otps table created.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrateUserOtps();
