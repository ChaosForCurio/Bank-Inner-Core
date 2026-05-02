require('dotenv').config(); 
const path = require('path');
const { sql } = require(path.join(__dirname, '../src/db')); 

async function run() {
    try {
        const tables = ['transactions', 'ledgers'];
        for (const tn of tables) {
            console.log(`\n--- TABLE: ${tn} ---`);
            const cols = await sql`
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = ${tn}
                ORDER BY ordinal_position
            `;
            console.table(cols);
        }
    } catch (err) {
        console.error(err);
    }
}
run();
