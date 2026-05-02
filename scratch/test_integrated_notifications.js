require('dotenv').config();
const { sql } = require('../src/db');
const NotificationService = require('../src/services/notification.service');

async function testIntegrated() {
    try {
        console.log('--- Testing Integrated Notification Service ---');
        
        // 1. Get a test user
        const users = await sql`SELECT id, name FROM users LIMIT 1`;
        if (users.length === 0) {
            console.error('No users found.');
            process.exit(1);
        }
        const user = users[0];
        console.log(`Using test user: ${user.name} (ID: ${user.id})`);

        // 2. Trigger notification
        const testTitle = 'Integration Test ' + Date.now();
        const testMessage = 'Testing the new NotificationService integration.';
        
        console.log('Calling NotificationService.notify...');
        await NotificationService.notify(user.id, testTitle, testMessage, 'info');

        // 3. Verify DB entry
        console.log('Verifying database entry...');
        const result = await sql`
            SELECT * FROM notifications 
            WHERE user_id = ${user.id} AND title = ${testTitle}
            LIMIT 1
        `;

        if (result.length > 0) {
            console.log('SUCCESS: Notification found in database!');
            console.log('Record details:', result[0]);
        } else {
            console.error('FAILURE: Notification not found in database.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testIntegrated();
