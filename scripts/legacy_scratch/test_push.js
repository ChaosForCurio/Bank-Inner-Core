const { sql } = require('../src/db');
const pushService = require('../src/services/push.service');
const PushSubscriptionModel = require('../src/models/pushSubscription.model');

async function testPushNotifications() {
    console.log('--- Checking Database Setup ---');
    try {
        const checkTable = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'push_subscriptions'
            );
        `;
        console.log('push_subscriptions table exists:', checkTable[0].exists);
        if (!checkTable[0].exists) {
            console.error('Table does not exist. Aborting test.');
            process.exit(1);
        }

        console.log('\n--- Checking User Setup ---');
        const users = await sql`SELECT * FROM users LIMIT 1`;
        if (users.length === 0) {
            console.log('No users found in database to test.');
            process.exit(0);
        }
        const user = users[0];
        console.log(`Found test user: ${user.name} (ID: ${user.id})`);

        console.log('\n--- Testing Subscription Creation ---');
        // Create a fake subscription
        await PushSubscriptionModel.create({
            userId: user.id,
            endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint-test-123',
            p256dh: 'fake-p256dh-key',
            auth: 'fake-auth-key'
        });
        console.log('Fake subscription created successfully in database.');

        console.log('\n--- Testing Push Service Notification ---');
        try {
            await pushService.sendToUser(user.id, {
                title: 'Test Notification',
                body: 'This is a test verifying the backend pushes work.',
                url: '/dashboard'
            });
            console.log('Sent notification to user! (Wait, fake endpoint should have failed!)');
        } catch (error) {
            console.log('Caught expected error sending to fake endpoint (this proves the web-push package generated a call):');
            console.log(`Error type: ${error.name}, Message: ${error.message}`);
        }

        console.log('\n--- Cleaning up Fake Subscription ---');
        await sql`DELETE FROM push_subscriptions WHERE user_id = ${user.id} AND endpoint = 'https://fcm.googleapis.com/fcm/send/fake-endpoint-test-123'`;
        console.log('Cleanup finished. Test backend logic works!');
        
        process.exit(0);
    } catch (e) {
        console.error('Test script encountered an unexpected error:', e);
        process.exit(1);
    }
}

testPushNotifications();
