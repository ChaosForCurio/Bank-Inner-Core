const FormData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const SENDER_EMAIL = process.env.MAILGUN_SENDER;

/**
 * Send a welcome email to a new user.
 */
async function sendWelcomeEmail(email, name, subject = "Welcome to Bank Inner Core", html) {
    try {
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: subject,
            html: html || `<p>Hello ${name}, Thank You for Registering with Bank Inner Core</p>`,
        });
        console.log('Welcome email sent successfully:', data);
    } catch (err) {
        console.error('Error sending welcome email:', err);
    }
}

async function sendTransactionEmail(userEmail, username, transactionId, amount, type) {
    try {
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [userEmail],
            subject: 'Transaction Notification',
            html: `<p>Hello ${username},</p><p>Transaction ID: ${transactionId}</p><p>Transaction Amount: ${amount}</p><p>Transaction Type: ${type}</p><p>Transaction Status: SUCCESS</p>`,
        });
        console.log('Transaction email sent successfully:', data);
    } catch (err) {
        console.error('Error sending transaction email:', err);
    }
}

async function sendTransactionFailEmail(userEmail, username, transactionId, amount, type) {
    try {
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [userEmail],
            subject: 'Transaction Notification - Failed',
            html: `<p>Hello ${username},</p><p>Transaction ID: ${transactionId}</p><p>Transaction Amount: ${amount}</p><p>Transaction Type: ${type}</p><p>Transaction Status: FAILED</p>`,
        });
        console.log('Transaction failed email sent successfully:', data);
    } catch (err) {
        console.error('Error sending transaction fail email:', err);
    }
}

async function sendLoginEmail(email, name) {
    try {
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: 'Login Notification',
            html: `<p>Hello ${name},</p><p>You have successfully logged in to Bank Inner Core.</p>`,
        });
        console.log('Login email sent successfully:', data);
    } catch (err) {
        console.error('Error sending login email:', err);
    }
}

async function sendSecurityAlertEmail(email, name, deviceStr, locationStr, ipAddress) {
    try {
        const time = new Date().toLocaleString();
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: 'Security Alert: New Login Detected',
            html: `
                <p>Hello ${name},</p>
                <p>We noticed a new login to your Bank Inner Core account from an unrecognized device or location.</p>
                <ul>
                    <li><strong>Device:</strong> ${deviceStr || 'Unknown Device'}</li>
                    <li><strong>Location:</strong> ${locationStr || 'Unknown Location'}</li>
                    <li><strong>IP Address:</strong> ${ipAddress}</li>
                    <li><strong>Time:</strong> ${time}</li>
                </ul>
                <p>If this was you, you can safely ignore this email.</p>
                <p>If you do not recognize this activity, please contact support immediately and change your password.</p>
            `,
        });
        console.log('Security alert email sent successfully:', data);
    } catch (err) {
        console.error('Error sending security alert email:', err);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendLoginEmail,
    sendTransactionEmail,
    sendTransactionFailEmail,
    sendSecurityAlertEmail
};
