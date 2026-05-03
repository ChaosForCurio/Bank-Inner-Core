const { sql, verifyConnection } = require("../../src/db");

async function migrate() {
    await verifyConnection();
    console.log("Adding advanced feature tables and columns...");

    try {
        // Burner Identity Proxies
        await sql`
            ALTER TABLE virtual_cards 
            ADD COLUMN IF NOT EXISTS proxy_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS proxy_phone VARCHAR(50);
        `;
        console.log("Added burner identity fields to virtual_cards.");

        // Swarm Payments
        await sql`
            CREATE TABLE IF NOT EXISTS swarm_campaigns (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                target_amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                merchant_details TEXT,
                status VARCHAR(50) DEFAULT 'funding', -- funding, completed, refunded
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS swarm_participants (
                id SERIAL PRIMARY KEY,
                swarm_id INTEGER NOT NULL REFERENCES swarm_campaigns(id) ON DELETE CASCADE,
                participant_email VARCHAR(255) NOT NULL,
                amount_due DECIMAL(15,2) NOT NULL,
                amount_paid DECIMAL(15,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(swarm_id, participant_email)
            );
        `;
        console.log("Added swarm payments tables.");

        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrate();
