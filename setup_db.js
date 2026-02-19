require("dotenv").config();
const { sql } = require("./src/db");

async function checkTables() {
    try {
        console.log("Checking tables...");
        const usersTable = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        `;
        console.log("Users table:", usersTable);

        const accountsTable = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'accounts'
        `;
        console.log("Accounts table:", accountsTable);

        if (accountsTable.length === 0) {
            console.log("Creating accounts table...");
            await sql`
                CREATE TABLE IF NOT EXISTS accounts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    status VARCHAR(20) DEFAULT 'active',
                    currency VARCHAR(10) DEFAULT 'INR',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log("Accounts table created.");
        }

    } catch (error) {
        console.error("Error checking/creating tables:", error);
    }
}

checkTables();
