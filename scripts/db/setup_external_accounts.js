require("dotenv").config();
const { sql } = require("../../src/db");

async function setupExternalAccountsTable() {
    try {
        console.log("Checking external_accounts table...");
        const tableCheck = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'external_accounts'
        `;

        if (tableCheck.length === 0) {
            console.log("Creating external_accounts table...");
            await sql`
                CREATE TABLE IF NOT EXISTS external_accounts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    institution_name VARCHAR(255) NOT NULL,
                    account_id VARCHAR(255) NOT NULL,
                    mask VARCHAR(10),
                    type VARCHAR(50),
                    access_token TEXT NOT NULL,
                    item_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log("external_accounts table created successfully.");
        } else {
            console.log("external_accounts table already exists.");
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating external_accounts table:", error);
        process.exit(1);
    }
}

setupExternalAccountsTable();
