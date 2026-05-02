require('dotenv').config();
const { sendBroadcastEmail } = require('../src/services/email.service');

async function testEmail() {
    const testEmail = 'bornash0001@gmail.com'; // Authorized recipient from .env
    const testName = 'Test User';
    const message = 'This is a test email to verify the notification system is working correctly.';
    const subject = 'Test Notification';

    try {
        console.log(`Attempting to send test email to ${testEmail}...`);
        const result = await sendBroadcastEmail(testEmail, testName, message, subject);
        console.log('Email sent successfully!', result.id);
    } catch (error) {
        console.error('Failed to send email:', error.message);
        if (error.details) console.error('Details:', error.details);
    }
}

testEmail();
