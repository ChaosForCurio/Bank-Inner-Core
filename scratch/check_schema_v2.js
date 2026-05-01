require('dotenv').config();
const { sql } = require('../src/db');

async function run() {
    try {
        const tables = ['users', 'accounts', 'beneficiaries', 'virtual_cards'];
        for (const table of tables) {
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table}
            `;
            console.log(`Schema for ${table}:`, JSON.stringify(columns, null, 2));
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
