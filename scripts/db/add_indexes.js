require('dotenv').config();
const { sql } = require("../../src/db");

async function addIndexes() {
    try {
        console.log("Adding indexes to improve query performance...");

        // Transactions table indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`;

        // External accounts table indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_external_accounts_user_id ON external_accounts(user_id);`;

        // Webhooks table indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN (events);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);`;

        // Users table
        await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`;

        console.log("Indexes added successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error adding indexes:", error);
        process.exit(1);
    }
}

addIndexes();
