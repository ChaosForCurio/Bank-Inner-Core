require('dotenv').config();
const { sql } = require('./src/db');

async function main() {
    try {
        const users = await sql`SELECT id, email, name, is_system FROM users ORDER BY id`;
        console.log("Users:");
        console.table(users);

        const accounts = await sql`SELECT id, user_id, status, currency FROM accounts ORDER BY id`;
        console.log("\nAccounts:");
        console.table(accounts);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
