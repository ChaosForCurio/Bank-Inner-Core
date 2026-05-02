require("dotenv").config();
const { sql } = require("./src/db");
const { sendBroadcastEmail } = require("./src/services/email.service");

async function broadcast() {
    try {
        console.log("Fetching all users...");
        const users = await sql`SELECT id, name, email FROM users WHERE email IS NOT NULL`;
        
        console.log(`Found ${users.length} users. Starting broadcast...`);
        
        const message = "This is a test broadcast to verify our notification system. Our bank is now more secure with advanced login tracking and MFA features.";
        const subject = "System Update: Enhanced Security Features";

        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            // Skip system user
            if (user.email === 'system@bank.com') continue;

            console.log(`Sending to ${user.name} (${user.email})...`);
            try {
                await sendBroadcastEmail(user.email, user.name, message, subject);
                successCount++;
            } catch (err) {
                console.error(`Failed to send to ${user.email}`);
                failCount++;
            }
        }

        console.log("\nBroadcast Summary:");
        console.log(`Total users targeted: ${users.length}`);
        console.log(`Successfully sent: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error("Fatal error in broadcast:", err);
        process.exit(1);
    }
}

broadcast();
