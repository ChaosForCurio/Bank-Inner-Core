require("dotenv").config();
const { sql } = require("../src/db");
const geoip = require("geoip-lite");
const LoginHistoryModel = require("../src/models/loginHistory.model");
const emailService = require("../src/services/email.service");

// Mock email service to prevent actually sending emails during test
emailService.sendSecurityAlertEmail = async (email, name, deviceStr, locationStr, ipAddress) => {
    console.log(`\n[MOCK EMAIL SENT] Security Alert for ${name} (${email})`);
    console.log(`- Device: ${deviceStr}`);
    console.log(`- Location: ${locationStr}`);
    console.log(`- IP: ${ipAddress}\n`);
};

async function runTest() {
    try {
        console.log("--- Testing Location & Device Fingerprinting ---");

        // 1. Get a random user
        const users = await sql`SELECT id, name, email FROM users LIMIT 1`;
        if (users.length === 0) {
            console.log("No users found to test with.");
            process.exit(0);
        }
        const user = users[0];
        console.log(`Testing with user: ${user.name}`);

        // --- Simulate First Login (Baseline) ---
        console.log("\nSimulating First Login (Baseline)...");
        const ip1 = "207.97.227.239"; // An IP from US
        const geo1 = geoip.lookup(ip1);
        const city1 = geo1 ? geo1.city : "Unknown City";
        const country1 = geo1 ? geo1.country : "Unknown Country";
        const device1 = "Chrome on Windows (desktop)";

        // Get recent logins BEFORE creating
        let recentLogins = await LoginHistoryModel.getRecentLogins(user.id, 5);
        
        await LoginHistoryModel.create({
            userId: user.id,
            ipAddress: ip1,
            deviceString: device1,
            city: city1,
            country: country1
        });

        let isNew = recentLogins.length > 0 && !recentLogins.some(
            l => l.device_string === device1 && l.city === city1 && l.country === country1
        );

        if (isNew) {
            await emailService.sendSecurityAlertEmail(user.email, user.name, device1, `${city1}, ${country1}`, ip1);
        } else {
            console.log("No alert sent (either first login ever, or recognized device).");
        }

        // --- Simulate Second Login (Same Device/Location) ---
        console.log("\nSimulating Second Login (Recognized)...");
        recentLogins = await LoginHistoryModel.getRecentLogins(user.id, 5);
        await LoginHistoryModel.create({
            userId: user.id,
            ipAddress: ip1,
            deviceString: device1,
            city: city1,
            country: country1
        });

        isNew = recentLogins.length > 0 && !recentLogins.some(
            l => l.device_string === device1 && l.city === city1 && l.country === country1
        );

        if (isNew) {
            await emailService.sendSecurityAlertEmail(user.email, user.name, device1, `${city1}, ${country1}`, ip1);
        } else {
            console.log("No alert sent (recognized device).");
        }

        // --- Simulate Third Login (New Device) ---
        console.log("\nSimulating Third Login (Unrecognized Device)...");
        const device2 = "Safari on iOS (mobile)";
        recentLogins = await LoginHistoryModel.getRecentLogins(user.id, 5);
        await LoginHistoryModel.create({
            userId: user.id,
            ipAddress: ip1,
            deviceString: device2,
            city: city1,
            country: country1
        });

        isNew = recentLogins.length > 0 && !recentLogins.some(
            l => l.device_string === device2 && l.city === city1 && l.country === country1
        );

        if (isNew) {
            await emailService.sendSecurityAlertEmail(user.email, user.name, device2, `${city1}, ${country1}`, ip1);
        } else {
            console.log("No alert sent.");
        }

        console.log("\n--- Test Complete ---");
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

runTest();
