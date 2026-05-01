require('dotenv').config();
const { sql } = require('../src/db');

async function run() {
    try {
        const accounts = await sql`
            SELECT a.id, a.user_id, a.balance, a.currency, u.name 
            FROM accounts a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.balance >= 10000000 
            OR a.id = 'b47f5ed1-0c2e-4bf6-bfe5-c705978a60dd'
        `;
        console.log(JSON.stringify(accounts, null, 2));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
