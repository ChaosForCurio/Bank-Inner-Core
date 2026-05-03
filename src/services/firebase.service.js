const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

/**
 * FirebaseService
 * Real-time synchronization using the Firebase Admin SDK.
 * 
 * SETUP:
 * 1. Download your service account key JSON from Firebase Console
 * 2. Save it as 'config/firebase-service-account.json'
 * 3. Or set FIREBASE_SERVICE_ACCOUNT_PATH in your .env
 */

let isInitialized = false;

function initialize() {
    if (isInitialized) return;

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                 path.join(__dirname, "../../config/firebase-service-account.json");

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL // Required for Realtime Database
            });
            isInitialized = true;
            console.log("Firebase Admin SDK initialized successfully.");
        } else {
            console.warn(`[Firebase] Service account not found at ${serviceAccountPath}. Sync will be skipped.`);
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
    }
}

const FirebaseService = {
    /**
     * syncTransaction - Pushes a transaction update to Firebase Realtime Database
     */
    async syncTransaction(transaction) {
        initialize();
        if (!isInitialized) return false;

        try {
            const { from_account_id, to_account_id, id } = transaction;
            
            // We find the user IDs associated with these accounts to sync to their private paths
            const { sql } = require("../db");
            const accounts = await sql`SELECT id, user_id FROM accounts WHERE id IN (${from_account_id}, ${to_account_id})`;
            
            const updates = {};
            for (const acc of accounts) {
                // Update the user's transaction history in real-time
                updates[`users/${acc.user_id}/transactions/${id}`] = {
                    ...transaction,
                    synced_at: admin.database.ServerValue.TIMESTAMP
                };
            }

            await admin.database().ref().update(updates);
            return true;
        } catch (error) {
            console.error("Firebase syncTransaction error:", error);
            return false;
        }
    },

    /**
     * syncBalance - Updates the user's real-time balance in Firebase
     */
    async syncBalance(userId, accountId, balance) {
        initialize();
        if (!isInitialized) return false;

        try {
            await admin.database().ref(`users/${userId}/accounts/${accountId}/balance`).set(balance);
            await admin.database().ref(`users/${userId}/accounts/${accountId}/last_updated`).set(admin.database.ServerValue.TIMESTAMP);
            return true;
        } catch (error) {
            console.error("Firebase syncBalance error:", error);
            return false;
        }
    }
};

module.exports = FirebaseService;
