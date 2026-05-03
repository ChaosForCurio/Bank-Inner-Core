require("dotenv").config();
const NotificationService = require("../src/services/notification.service");
const { sql } = require("../src/db");


async function runAudit() {
    console.log("--- Starting Notification System Audit ---");
    
    // 1. Check DB Table for settings
    try {
        const tableCheck = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_settings');`;
        console.log("Database: notification_settings table exists:", tableCheck[0].exists);
    } catch (e) {
        console.error("Database Check Failed:", e.message);
    }

    // 2. Simulate a Notification
    const testUserId = 2; // Real user ID

    const title = "Audit Test: Critical Alert";
    const message = "This is a test of the unified notification system.";
    const type = "security";
    const metadata = {
        location: "Mumbai, IN",
        device: "Chrome on Windows",
        actions: [
            { action: "approve", title: "It was me" },
            { action: "block", title: "Block Account" }
        ]
    };

    console.log(`\nSimulating ${type} notification for User ${testUserId}...`);
    
    try {
        await NotificationService.notify(testUserId, title, message, type, metadata);
        console.log("Notification dispatch initiated successfully.");
        
        // 3. Verify DB persistence
        setTimeout(async () => {
            const result = await sql`
                SELECT id, title, type, requires_fallback 
                FROM notifications 
                WHERE user_id = ${testUserId} 
                ORDER BY created_at DESC LIMIT 1
            `;
            if (result.length > 0) {
                console.log("\nPersistence Check:");
                console.log("- Notification saved in DB:", result[0].title);
                console.log("- Requires Fallback:", result[0].requires_fallback);
                
                console.log("\n--- Audit Complete ---");
                process.exit(0);
            }
        }, 1000);

    } catch (error) {
        console.error("Audit Simulation Failed:", error);
        process.exit(1);
    }
}

runAudit();
