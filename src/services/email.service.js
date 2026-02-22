const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = 'notifications@bank-inner-core-4s7p.vercel.com';
const WELCOME_SENDER = `Xieriee Bank <${SENDER_EMAIL}>`;
const NOTIFICATION_SENDER = `Secure Banking <${SENDER_EMAIL}>`;

/**
 * Send a welcome email to a new user.
 * @param {string} email - The recipient's email address.
 * @param {string} name - The recipient's name.
 * @param {string} subject - The subject of the email.
 * @param {string} html - The HTML content of the email.
 * @returns {Promise<void>}
 */
async function sendWelcomeEmail(email, name, subject = "Welcome to Bank Inner Core", html) {
    try {
        const { data, error } = await resend.emails.send({
            from: WELCOME_SENDER,
            to: email,
            subject: subject,
            html: html || `<p>Hello ${name}, Thank You for Registering with Bank Inner Core</p>`,
        });

        if (error) {
            console.error('Error sending welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', data);
        }
    } catch (err) {
        console.error('Unexpected error sending welcome email:', err);
    }
}

async function sendTransactionEmail(userEmail, username, transactionId, amount, type) {
    try {
        const { data, error } = await resend.emails.send({
            from: NOTIFICATION_SENDER,
            to: userEmail,
            subject: 'Transaction Notification',
            html: `<p>Hello ${username},</p><p>Transaction ID: ${transactionId}</p><p>Transaction Amount: ${amount}</p><p>Transaction Type: ${type}</p><p>Transaction Status: SUCCESS</p>`,
        });

        if (error) {
            console.error('Error sending transaction email:', error);
        } else {
            console.log('Transaction email sent successfully:', data);
        }
    } catch (err) {
        console.error('Unexpected error sending transaction email:', err);
    }
}


async function sendTransactionFailEmail(userEmail, username, transactionId, amount, type) {
    try {
        const { data, error } = await resend.emails.send({
            from: NOTIFICATION_SENDER,
            to: userEmail,
            subject: 'Transaction Notification - Failed',
            html: `<p>Hello ${username},</p><p>Transaction ID: ${transactionId}</p><p>Transaction Amount: ${amount}</p><p>Transaction Type: ${type}</p><p>Transaction Status: FAILED</p>`,
        });

        if (error) {
            console.error('Error sending transaction email:', error);
        } else {
            console.log('Transaction email sent successfully:', data);
        }
    } catch (err) {
        console.error('Unexpected error sending transaction email:', err);
    }
}

async function sendLoginEmail(email, name) {
    try {
        const { data, error } = await resend.emails.send({
            from: NOTIFICATION_SENDER,
            to: email,
            subject: 'Login Notification',
            html: `<p>Hello ${name},</p><p>You have successfully logged in to Bank Inner Core.</p>`,
        });

        if (error) {
            console.error('Error sending login email:', error);
        } else {
            console.log('Login email sent successfully:', data);
        }
    } catch (err) {
        console.error('Unexpected error sending login email:', err);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendLoginEmail,
    sendTransactionEmail,
    sendTransactionFailEmail
};
