const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('Twilio credentials not found in environment variables. SMS service will be disabled.');
}

/**
 * Send a generic SMS message
 * @param {string} to - Destination phone number (e.g., +1234567890)
 * @param {string} body - The message body
 */
async function sendSms(to, body) {
    if (!client) {
        console.warn('Cannot send SMS: Twilio is not configured.');
        return;
    }

    try {
        const message = await client.messages.create({
            body: body,
            from: twilioPhoneNumber,
            to: to
        });
        console.log(`SMS sent successfully to ${to}. Message SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}

/**
 * Send an OTP via SMS
 */
async function sendOTP(to, code) {
    const body = `Your Bank Inner Core verification code is: ${code}. Do not share this code with anyone.`;
    return sendSms(to, body);
}

/**
 * Send a transaction alert via SMS
 */
async function sendTransactionAlert(to, amount, status) {
    const body = `Bank Inner Core: A transaction of ${amount} was just processed. Status: ${status}.`;
    return sendSms(to, body);
}

/**
 * Send a security alert via SMS
 */
async function sendSecurityAlert(to, location) {
    const body = `Bank Inner Core Alert: A new login was detected near ${location}. If this wasn't you, contact support immediately.`;
    return sendSms(to, body);
}

module.exports = {
    sendSms,
    sendOTP,
    sendTransactionAlert,
    sendSecurityAlert
};
