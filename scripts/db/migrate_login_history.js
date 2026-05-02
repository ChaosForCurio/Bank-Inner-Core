require("dotenv").config();
const { sql } = require("../../src/db");

async function migrateLoginHistory() {
    try {
        console.log("Migrating login_history table...");

        // Add device_string, city, country columns if they do not exist
        await sql`
            ALTER TABLE login_history
            ADD COLUMN IF NOT EXISTS device_string VARCHAR(255),
            ADD COLUMN IF NOT EXISTS city VARCHAR(255),
            ADD COLUMN IF NOT EXISTS country VARCHAR(255)
        `;

        console.log("login_history table migrated successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error migrating login_history table:", error);
        process.exit(1);
    }
}

migrateLoginHistory();
