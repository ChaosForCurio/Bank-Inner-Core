require('dotenv').config();
const { sql } = require('./src/db');

async function main() {
    const users = await sql`SELECT id, email, is_system FROM users`;
    const accounts = await sql`SELECT id, user_id, balance, currency FROM accounts`;

    console.log("--- USERS ---");
    users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, System: ${u.is_system}`));

    console.log("\n--- ACCOUNTS ---");
    accounts.forEach(a => console.log(`ID: ${a.id}, UserID: ${a.user_id}, Balance: ${a.balance}, Currency: ${a.currency}`));
}
main().catch(console.error).finally(() => process.exit());
