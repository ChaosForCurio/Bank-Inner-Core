require('dotenv').config();
const { sql } = require('./src/db');
const AccountModel = require('./src/models/account.model');

async function main() {
    try {
        const userId = 8; // System user ID
        const amount = 10000;
        const currency = 'INR';

        // 1. Get system account
        const accounts = await AccountModel.findByUserId(userId);
        if (accounts.length === 0) {
            console.error("No account found for user 8");
            process.exit(1);
        }
        const account = accounts[0];

        console.log(`Adding ${amount} ${currency} to account ID ${account.id} (User ${userId})`);

        // A. Update balance
        const updatedAccounts = await sql`
            UPDATE accounts 
            SET balance = balance + ${amount}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${account.id}
            RETURNING *
        `;
        const newBalance = updatedAccounts[0].balance;

        // B. Create Transaction record
        const idempotencyKey = `initial_funding_${Date.now()}`;
        const transactions = await sql`
            INSERT INTO transactions (from_account, to_account, amount, type, idempotency_key, status)
            VALUES (NULL, ${account.id}, ${amount}, 'deposit', ${idempotencyKey}, 'completed')
            RETURNING id
        `;
        const transactionId = transactions[0].id;

        // C. Create Ledger record
        await sql`
            INSERT INTO ledgers (account_id, transaction_id, amount, type, balance, description)
            VALUES (${account.id}, ${transactionId}, ${amount}, 'credit', ${newBalance}, 'Initial system funding')
        `;

        console.log("Success! Updated balance:", newBalance);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}
main();
