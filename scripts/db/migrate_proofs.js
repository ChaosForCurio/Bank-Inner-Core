require("dotenv").config();
const { sql } = require("../../src/db");

async function migrate() {
    try {
        console.log("Starting Proof of Wealth migration...");

        console.log("Creating proofs table...");
        await sql`
            CREATE TABLE IF NOT EXISTS balance_proofs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount NUMERIC(15, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                expires_at TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'active', -- 'active', 'revoked', 'expired'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Proof migration completed successfully.");
    } catch (error) {
        console.error("Proof migration failed:", error);
        process.exit(1);
    }
}

migrate();
