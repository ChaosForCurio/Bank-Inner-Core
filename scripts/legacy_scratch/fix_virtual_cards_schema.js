require('dotenv').config();
const { sql } = require('../src/db');

async function fixSchema() {
    try {
        console.log("Applying schema fixes to virtual_cards...");
        
        // 1. Add updated_at column
        await sql`
            ALTER TABLE virtual_cards 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `;
        console.log("Success: Added updated_at column or it already exists.");

        // 2. Ensure CVV is at least 3 chars (already should be, but let's check or adjust if needed)
        // Usually VARCHAR(3) is fine but some cards have 4.
        await sql`
            ALTER TABLE virtual_cards 
            ALTER COLUMN cvv TYPE VARCHAR(4);
        `;
        console.log("Success: Updated CVV column type to VARCHAR(4).");

    } catch (error) {
        console.error("Failed to apply schema fixes:", error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
