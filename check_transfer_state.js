require('dotenv').config();
const { sql } = require('./src/db');

async function main() {
    try {
        const users = await sql`SELECT id, email, name, is_system FROM users`;
        console.log("Users:");
        console.log(JSON.stringify(users, null, 2));

        const accounts = await sql`SELECT id, user_id, status, currency, balance FROM accounts`;
        console.log("\nAccounts:");
        console.log(JSON.stringify(accounts, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
