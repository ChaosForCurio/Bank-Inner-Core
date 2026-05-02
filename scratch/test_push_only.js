require('dotenv').config();
const { sql } = require('../src/db');
const pushService = require('../src/services/push.service');
const PushSubscriptionModel = require('../src/models/pushSubscription.model');

async function testPush() {
    try {
        console.log('--- Testing Push Notifications ---');
        
        // 1. Get a test user
        const users = await sql`SELECT id, name FROM users LIMIT 1`;
        if (users.length === 0) {
            console.error('No users found in database. Please create a user first.');
            process.exit(1);
        }
        const user = users[0];
        console.log(`Using test user: ${user.name} (ID: ${user.id})`);

        // 2. Create a temporary fake subscription
        const fakeEndpoint = 'https://fcm.googleapis.com/fcm/send/fake-endpoint-' + Date.now();
        await PushSubscriptionModel.create({
            userId: user.id,
            endpoint: fakeEndpoint,
            p256dh: 'fake-p256dh-key',
            auth: 'fake-auth-key'
        });
        console.log('Fake subscription created.');

        // 3. Attempt to send
        console.log('Attempting to send push notification (expecting 403/404/410 because endpoint is fake)...');
        await pushService.sendToUser(user.id, {
            title: 'Test Push',
            body: 'Verify backend push logic',
            url: '/dashboard'
        });
        
        console.log('Push service call completed.');
        
        // Note: Since the endpoint is fake, it will likely log an error in the console from pushService.js,
        // but the code should continue if it handles the error properly.
        
        // 4. Cleanup
        await sql`DELETE FROM push_subscriptions WHERE endpoint = ${fakeEndpoint}`;
        console.log('Cleanup finished.');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testPush();
