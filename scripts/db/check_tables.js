require('dotenv').config();
const { sql } = require('./src/db');

async function checkTables() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables in public schema:");
        console.log(JSON.stringify(tables, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkTables();
