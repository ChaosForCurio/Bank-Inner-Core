require('dotenv').config();
const { sql } = require('../src/db');

async function checkTable() {
    try {
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position;
        `;
        
        if (result.length === 0) {
            console.log('Table "notifications" does not exist.');
        } else {
            console.log('Schema for "notifications" table:');
            result.forEach(col => {
                console.log(`- ${col.column_name}: ${col.data_type}`);
            });
        }
        
        const count = await sql`SELECT count(*) FROM notifications`;
        console.log(`\nTotal notifications in database: ${count[0].count}`);
        
    } catch (error) {
        console.error('Error checking table:', error);
    } finally {
        process.exit(0);
    }
}

checkTable();
