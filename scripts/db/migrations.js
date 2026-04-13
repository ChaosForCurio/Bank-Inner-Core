require("dotenv").config();
const { sql } = require("../../src/db");

async function migrate() {
    try {
        console.log("Starting migrations...");

        // 1. Beneficiaries Table
        console.log("Creating beneficiaries table...");
        await sql`
            CREATE TABLE IF NOT EXISTS beneficiaries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                beneficiary_account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                nickname VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 2. Scheduled Transfers Table
        console.log("Creating scheduled_transfers table...");
        await sql`
            CREATE TABLE IF NOT EXISTS scheduled_transfers (
                id SERIAL PRIMARY KEY,
                from_account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                to_account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                amount NUMERIC(15, 2) NOT NULL,
                frequency VARCHAR(20) DEFAULT 'once', -- 'once', 'daily', 'weekly', 'monthly'
                next_run_date TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 3. Notifications Table
        console.log("Creating notifications table...");
        await sql`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
                read_status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 4. Push Subscriptions Table
        console.log("Creating push_subscriptions table...");
        await sql`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                endpoint TEXT UNIQUE NOT NULL,
                p256dh VARCHAR(255) NOT NULL,
                auth VARCHAR(255) NOT NULL,
                device_type VARCHAR(50) DEFAULT 'unknown',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
