require('dotenv').config();
const { sendWelcomeEmail } = require('./src/services/email.service');

const testEmail1 = 'chaoswithgaming0001@gmail.com';
const testEmail2 = 'bornash0001@gmail.com';
const testName = 'Chaos Gamer';

async function runTest() {
    console.log(`Starting email tests...`);

    console.log(`\n--- Testing Email 1: ${testEmail1} ---`);
    try {
        await sendWelcomeEmail(testEmail1, testName, "Test Mailgun Delivery (Chaos)", `<p>Test 1</p>`);
    } catch (e) {
        console.error("Test 1 failed (expected if not verified)");
    }

    console.log(`\n--- Testing Email 2: ${testEmail2} ---`);
    try {
        await sendWelcomeEmail(testEmail2, testName, "Test Mailgun Delivery (Bornash)", `<p>Test 2</p>`);
    } catch (e) {
        console.error("Test 2 failed");
    }

    console.log("\nTest execution completed.");
    process.exit();
}

runTest();
