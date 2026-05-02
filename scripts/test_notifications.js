require('dotenv').config();
const { sendWelcomeEmail } = require('../src/services/email.service');
const { sendOTP } = require('../src/services/sms.service');

async function testNotifications() {
    console.log("Testing Email Notification...");
    try {
        // Replace with a valid email address for testing
        const testEmail = "test@example.com"; 
        await sendWelcomeEmail(testEmail, "Test User");
        console.log("Email test triggered.");
    } catch (err) {
        console.error("Email test failed:", err);
    }

    console.log("\nTesting SMS Notification...");
    try {
        // Replace with a valid phone number including country code (e.g. +1234567890)
        const testPhone = "+1234567890";
        await sendOTP(testPhone, "123456");
        console.log("SMS test triggered.");
    } catch (err) {
        console.error("SMS test failed:", err);
    }
}

testNotifications();
