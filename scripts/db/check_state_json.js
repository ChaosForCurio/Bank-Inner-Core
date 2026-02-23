require('dotenv').config();
const { sql } = require('./src/db');

async function main() {
    try {
        const users = await sql`SELECT id, email, name, is_system FROM users ORDER BY id`;
        const accounts = await sql`SELECT id, user_id, status, currency FROM accounts ORDER BY id`;
        console.log(JSON.stringify({ users, accounts }, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
