require("dotenv").config();
const { sql } = require("../src/db");
const OpenBankingService = require("../src/services/openBanking.service");
const ExternalAccountModel = require("../src/models/externalAccount.model");

async function runTest() {
    try {
        console.log("--- Testing Open Banking Service ---");
        
        // 1. Get a random user
        const users = await sql`SELECT id FROM users LIMIT 1`;
        if (users.length === 0) {
            console.log("No users found to test with.");
            process.exit(0);
        }
        const userId = users[0].id;
        console.log(`Using user ID: ${userId}`);

        // 2. Create link token
        const linkTokenRes = await OpenBankingService.createLinkToken(userId);
        console.log("Link Token response:", linkTokenRes);

        // 3. Exchange public token
        const publicToken = "mock-public-token-123";
        const exchangeRes = await OpenBankingService.exchangePublicToken(userId, publicToken, "Test Bank");
        console.log("Exchange Token response (Account Created):", exchangeRes);

        const accountId = exchangeRes.id;

        // 4. Get balances
        const balances = await OpenBankingService.getBalances(accountId);
        console.log("Get Balances response:", balances);

        // 5. Delete test account
        const deleted = await ExternalAccountModel.delete(accountId, userId);
        console.log(`Test account deleted: ${deleted}`);

        console.log("--- Test Complete ---");
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

runTest();
