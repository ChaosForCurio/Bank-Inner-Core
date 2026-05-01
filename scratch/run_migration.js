require('dotenv').config();
const path = require('path');
const { sql } = require(path.join(__dirname, '../src/db'));

async function run() {
    try {
        console.log("Starting migration...");

        // Create virtual_cards table
        await sql`
            CREATE TABLE IF NOT EXISTS virtual_cards (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                card_number VARCHAR(16) NOT NULL,
                expiry_date VARCHAR(5) NOT NULL,
                cvv VARCHAR(3) NOT NULL,
                name_on_card VARCHAR(255) NOT NULL,
                type VARCHAR(20) NOT NULL DEFAULT 'disposable',
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log("Table virtual_cards created or already exists.");

        // Update transactions table
        await sql`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(20, 10),
            ADD COLUMN IF NOT EXISTS source_amount NUMERIC(20, 2),
            ADD COLUMN IF NOT EXISTS target_amount NUMERIC(20, 2)
        `;
        console.log("Table transactions updated with multi-currency fields.");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
