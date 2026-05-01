require('dotenv').config();
const { sql } = require('../src/db');

async function run() {
    try {
        const schemas = await sql`SELECT schema_name FROM information_schema.schemata`;
        console.log("Schemas:", JSON.stringify(schemas, null, 2));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
