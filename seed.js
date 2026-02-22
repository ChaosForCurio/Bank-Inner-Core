require('dotenv').config();
const { sql } = require('./src/db');

async function seed() {
    console.log("Seeding all accounts with 10,000 INR...");
    try {
        await sql`UPDATE accounts SET balance = 10000.00`;
        console.log("Success! All accounts updated.");
        const accounts = await sql`SELECT user_id, balance FROM accounts LIMIT 5`;
        console.log(accounts);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

seed();
