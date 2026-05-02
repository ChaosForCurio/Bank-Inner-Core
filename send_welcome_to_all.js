require("dotenv").config();
const { sql } = require("./src/db");
const { sendWelcomeEmail } = require("./src/services/email.service");

async function sendWelcomeToAll() {
    try {
        console.log("Fetching all users...");
        const users = await sql`SELECT id, name, email FROM users WHERE email IS NOT NULL`;
        
        console.log(`Found ${users.length} users. Starting Welcome Email campaign...`);
        
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            // Skip system user
            if (user.email === 'system@bank.com') continue;

            console.log(`Sending Welcome to ${user.name} (${user.email})...`);
            try {
                await sendWelcomeEmail(user.email, user.name);
                successCount++;
            } catch (err) {
                console.error(`Failed to send Welcome to ${user.email}`);
                failCount++;
            }
        }

        console.log("\nWelcome Campaign Summary:");
        console.log(`Total users targeted: ${users.length}`);
        console.log(`Successfully sent: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error("Fatal error in welcome campaign:", err);
        process.exit(1);
    }
}

sendWelcomeToAll();
