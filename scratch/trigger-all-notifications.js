require("dotenv").config();
const NotificationService = require("../src/services/notification.service");

async function triggerAll() {
    const userId = 2; // Test User
    
    console.log("--- Triggering All Notification Types One-by-One ---\n");

    // 1. Info Notification
    console.log("1. Sending [INFO] Notification...");
    await NotificationService.notify(userId, 
        "System Update", 
        "The Bank Inner Core platform has been upgraded to v2.0.", 
        "info"
    );
    console.log("✔ Info notification dispatched.\n");

    // 2. Transaction Notification
    console.log("2. Sending [TRANSACTION] Notification (with Actions)...");
    await NotificationService.notify(userId, 
        "Payment Request Received", 
        "Amazon is requesting a payment of ₹1,299.00.", 
        "transaction", 
        {
            amount: "₹1,299.00",
            transactionId: "TXN_99283",
            type: "Debit",
            actions: [
                { action: "approve", title: "Approve" },
                { action: "decline", title: "Decline" }
            ]
        }
    );
    console.log("✔ Transaction notification (with Approve/Decline) dispatched.\n");

    // 3. Security Notification
    console.log("3. Sending [SECURITY] Notification (with Fallback enabled)...");
    await NotificationService.notify(userId, 
        "New Device Login Detected", 
        "A login was detected from a new device in London, UK.", 
        "security", 
        {
            location: "London, UK",
            device: "Safari on iPhone 15",
            ip: "182.16.0.1"
        }
    );
    console.log("✔ Security alert dispatched (Fallback timer started).\n");

    console.log("--- All dispatches complete. Checking DB for verification... ---");
    process.exit(0);
}

triggerAll();
