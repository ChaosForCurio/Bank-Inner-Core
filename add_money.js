require('dotenv').config();
const { sql } = require('./src/db');
const crypto = require('crypto');

async function run() {
    try {
        const idempotencyKey = crypto.randomUUID();
        const hash = crypto.createHash('sha256').update(idempotencyKey).digest('hex');
        await sql`INSERT INTO transactions (to_account, amount, type, status, category, idempotency_key, hash) VALUES (36, 10000, 'credit', 'completed', 'Deposit', ${idempotencyKey}, ${hash})`;
        await sql`UPDATE accounts SET balance = balance + 10000 WHERE id = 36`;
        console.log('Added 10000 to account 36!');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
