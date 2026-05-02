const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const SENDER_EMAIL = process.env.MAILGUN_SENDER;

// Helper to compile handlebars template
function compileTemplate(templateName, data) {
    const filePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    const source = fs.readFileSync(filePath, 'utf-8');
    const template = handlebars.compile(source);
    return template(data);
}

/**
 * Send a welcome email to a new user.
 */
async function sendWelcomeEmail(email, name, subject = "Welcome to Bank Inner Core") {
    try {
        const html = compileTemplate('welcome', { name });
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: subject,
            html: html,
        });
        console.log(`Welcome email sent to ${email}:`, data.id);
        return data;
    } catch (err) {
        console.error(`Error sending welcome email to ${email}:`, err.message);
        throw err;
    }
}

async function sendTransactionEmail(userEmail, username, transactionId, amount, type) {
    try {
        const html = compileTemplate('transaction', { name: username, transactionId, amount, type });
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [userEmail],
            subject: 'Transaction Notification',
            html: html,
        });
        console.log('Transaction email sent successfully:', data);
    } catch (err) {
        console.error('Error sending transaction email:', err);
    }
}

async function sendTransactionFailEmail(userEmail, username, transactionId, amount, type) {
    try {
        const html = compileTemplate('transactionFail', { name: username, transactionId, amount, type });
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [userEmail],
            subject: 'Transaction Notification - Failed',
            html: html,
        });
        console.log('Transaction failed email sent successfully:', data);
    } catch (err) {
        console.error('Error sending transaction fail email:', err);
    }
}

async function sendLoginEmail(email, name) {
    try {
        const html = compileTemplate('login', { name });
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: 'Login Notification',
            html: html,
        });
        console.log('Login email sent successfully:', data);
    } catch (err) {
        console.error('Error sending login email:', err);
    }
}

async function sendSecurityAlertEmail(email, name, deviceStr, locationStr, ipAddress) {
    try {
        const time = new Date().toLocaleString();
        const html = compileTemplate('securityAlert', { 
            name, 
            deviceStr: deviceStr || 'Unknown Device', 
            locationStr: locationStr || 'Unknown Location', 
            ipAddress, 
            time 
        });
        
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: 'Security Alert: New Login Detected',
            html: html,
        });
        console.log('Security alert email sent successfully:', data);
    } catch (err) {
        console.error('Error sending security alert email:', err);
    }
}

async function sendBroadcastEmail(email, name, message, subject = "System Notification - Bank Inner Core") {
    try {
        const html = compileTemplate('broadcast', { name, message });
        const data = await mg.messages.create(MAILGUN_DOMAIN, {
            from: SENDER_EMAIL,
            to: [email],
            subject: subject,
            html: html,
        });
        console.log(`Broadcast email sent to ${email}:`, data.id);
        return data;
    } catch (err) {
        console.error(`Error sending broadcast email to ${email}:`, err.message);
        throw err;
    }
}

module.exports = {
    sendWelcomeEmail,
    sendLoginEmail,
    sendTransactionEmail,
    sendTransactionFailEmail,
    sendSecurityAlertEmail,
    sendBroadcastEmail
};
