require('dotenv').config(); 
const path = require('path');
const { sql } = require(path.join(__dirname, '../src/db')); 

async function run() {
    try {
        const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        for (const t of tables) {
            console.log(`\n--- TABLE: ${t.table_name} ---`);
            const cols = await sql`
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = ${t.table_name}
                ORDER BY ordinal_position
            `;
            console.table(cols);
        }
    } catch (err) {
        console.error(err);
    }
}
run();
