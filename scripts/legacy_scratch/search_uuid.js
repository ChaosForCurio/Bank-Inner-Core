require('dotenv').config();
const { sql } = require('../src/db');

async function run() {
    const uuid = 'b47f5ed1-0c2e-4bf6-bfe5-c705978a60dd';
    try {
        console.log(`Searching for UUID: ${uuid}`);
        
        // Search in users
        const user = await sql`SELECT id, name, email FROM users WHERE id::text = ${uuid} OR name = ${uuid}`;
        if (user.length > 0) console.log("Found in users:", user);

        // Search in accounts
        const account = await sql`SELECT id, user_id, balance FROM accounts WHERE id::text = ${uuid}`;
        if (account.length > 0) console.log("Found in accounts:", account);

        // Search in beneficiaries
        const beneficiary = await sql`SELECT id, user_id, name, account_number FROM beneficiaries WHERE id::text = ${uuid}`;
        if (beneficiary.length > 0) console.log("Found in beneficiaries:", beneficiary);

        // Let's check if any table has a column that might contain this UUID
        const tablesWithUuid = await sql`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND (data_type = 'uuid' OR data_type = 'text' OR data_type = 'character varying')
        `;
        
        for (const row of tablesWithUuid) {
            try {
                const result = await sql.unsafe(`SELECT * FROM ${row.table_name} WHERE ${row.column_name} = $1`, [uuid]);
                if (result.length > 0) {
                    console.log(`Found in table ${row.table_name}, column ${row.column_name}:`, result);
                }
            } catch (e) {
                // Ignore errors like "operator does not exist" for non-matching types
            }
        }

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
