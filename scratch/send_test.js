require('dotenv/config');
const { sql } = require('../src/db');
const pushService = require('../src/services/push.service');

async function sendNotification() {
    try {
        const uuid = '99db7272-0088-40d8-a3c7-d4d180550ab8';
        const users = await sql`SELECT id, name FROM users WHERE uuid = ${uuid}`;
        
        if (users.length === 0) {
            console.log('User with UUID ' + uuid + ' not found.');
            process.exit(1);
        }
        
        const user = users[0];
        console.log('Found user:', user.name, '(ID:', user.id + ')');
        
        await pushService.sendToUser(user.id, {
            title: 'Test Notification',
            body: 'Hello ' + user.name + '! This is a test push notification sent via the admin dashboard.',
            url: '/dashboard'
        });
        
        console.log('Notification dispatched successfully!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

sendNotification();
