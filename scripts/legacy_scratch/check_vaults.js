
require('dotenv').config();
const { sql } = require('../src/db');

async function checkVaults() {
    try {
        console.log("Checking vaults table...");
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables in public schema:", tables.map(t => t.table_name).join(", "));

        const vaultTableExists = tables.some(t => t.table_name === 'vaults');
        
        if (vaultTableExists) {
            console.log("Vaults table exists. Checking schema...");
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'vaults'
            `;
            console.log("Vaults table columns:");
            columns.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

            console.log("\nChecking vault data...");
            const data = await sql`SELECT * FROM vaults LIMIT 5`;
            console.log("Vault data (first 5):", data);
        } else {
            console.log("Vaults table DOES NOT EXIST!");
        }
    } catch (error) {
        console.error("Error checking vaults:", error);
    } finally {
        process.exit();
    }
}

checkVaults();
