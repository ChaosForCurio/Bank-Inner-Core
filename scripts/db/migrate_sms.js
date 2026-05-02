require("dotenv").config();
const { sql } = require("../../src/db");

async function migrateSms() {
    try {
        console.log("Adding phone_number column to users table...");
        
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)
        `;
        
        console.log("Migration successful: phone_number column added.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrateSms();
