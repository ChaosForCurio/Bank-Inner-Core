require("dotenv").config();
const ProofService = require("../src/services/proof.service");
const { sql } = require("../src/db");

async function testProof() {
    try {
        console.log("Testing Proof of Wealth Service...");
        
        // 1. Get a test user with some balance
        const users = await sql`SELECT id FROM users LIMIT 1`;
        if (users.length === 0) {
            console.log("No users found to test with.");
            return;
        }
        const userId = users[0].id;

        // 2. Generate a proof for a small amount (should succeed)
        console.log(`Generating proof for user ${userId} for amount 10...`);
        const { token } = await ProofService.generate({ userId, amount: 10 });
        console.log("Token generated:", token.slice(0, 50) + "...");

        // 3. Verify the token
        console.log("Verifying token...");
        const result = await ProofService.verify(token);
        console.log("Verification result:", result);

        if (result.valid) {
            console.log("✅ Proof of Wealth is working!");
        } else {
            console.log("❌ Proof of Wealth failed verification.");
        }

    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

testProof();
