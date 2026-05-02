require("dotenv").config();
const { sql } = require("../../src/db");

async function migrate() {
    try {
        console.log("Starting Webhook migration...");

        // 1. Webhooks Table
        console.log("Creating webhooks table...");
        await sql`
            CREATE TABLE IF NOT EXISTS webhooks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                secret VARCHAR(255) NOT NULL,
                events TEXT[] NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 2. Webhook Logs Table (for debugging delivery issues)
        console.log("Creating webhook_logs table...");
        await sql`
            CREATE TABLE IF NOT EXISTS webhook_logs (
                id SERIAL PRIMARY KEY,
                webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
                event_type VARCHAR(50) NOT NULL,
                payload JSONB NOT NULL,
                response_status INTEGER,
                response_body TEXT,
                attempt_count INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'pending', -- 'success', 'failed', 'retrying'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Webhook migration completed successfully.");
    } catch (error) {
        console.error("Webhook migration failed:", error);
        process.exit(1);
    }
}

migrate();
