const { sql, verifyConnection } = require("../src/db");

async function migrate() {
    await verifyConnection();
    console.log("Adding inheritance tables...");

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS inheritance_configs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                beneficiary_id INTEGER NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
                trigger_months INTEGER NOT NULL DEFAULT 6,
                status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, escalating, executed, cancelled
                escalation_stage INTEGER NOT NULL DEFAULT 0,
                last_contacted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            );
        `;
        
        await sql`
            CREATE TABLE IF NOT EXISTS inheritance_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrate();
