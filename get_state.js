const { sql } = require('./src/db');
require('dotenv').config();
const fs = require('fs');

async function main() {
    try {
        const users = await sql`SELECT id, email FROM users`;
        const accounts = await sql`SELECT id, user_id, balance, currency FROM accounts`;

        let output = "--- USERS ---\n";
        users.forEach(u => output += `ID: ${u.id}, Email: ${u.email}\n`);

        output += "\n--- ACCOUNTS ---\n";
        accounts.forEach(a => output += `ID: ${a.id}, UserID: ${a.user_id}, Balance: ${a.balance}, Currency: ${a.currency}\n`);

        fs.writeFileSync('db_state.txt', output, 'utf8');
        console.log("State written to db_state.txt");
    } catch (err) {
        fs.writeFileSync('db_state.txt', err.stack, 'utf8');
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
