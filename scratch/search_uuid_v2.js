require('dotenv').config();
const { sql } = require('../src/db');

async function run() {
    const uuid = 'b47f5ed1-0c2e-4bf6-bfe5-c705978a60dd';
    try {
        console.log(`Searching for UUID: ${uuid}`);
        
        // Search in all tables systematically
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        for (const { table_name } of tables) {
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table_name}
                AND (data_type = 'uuid' OR data_type = 'text' OR data_type = 'character varying')
            `;
            
            for (const { column_name } of columns) {
                try {
                    const result = await sql.unsafe(`SELECT * FROM ${table_name} WHERE ${column_name}::text = $1`, [uuid]);
                    if (result.length > 0) {
                        console.log(`Bingo! Found in table [${table_name}], column [${column_name}]:`);
                        console.log(JSON.stringify(result, null, 2));
                    }
                } catch (e) {
                    // console.error(`Error searching ${table_name}.${column_name}:`, e.message);
                }
            }
        }

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
