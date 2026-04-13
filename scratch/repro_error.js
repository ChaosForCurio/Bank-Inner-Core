const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { sql } = require("../src/db");
const PasskeyController = require("../src/controllers/passkey.controller");

async function test() {
    try {
        // Find a user with passkeys
        const usersWithPasskeys = await sql`
            SELECT u.email 
            FROM users u
            JOIN passkeys p ON u.id = p.user_id
            LIMIT 1
        `;

        if (usersWithPasskeys.length === 0) {
            console.log("No users with passkeys found. Please register one first.");
            return;
        }

        const email = usersWithPasskeys[0].email;
        console.log("Testing with email:", email);

        const req = {
            body: { email }
        };
        const res = {
            statusCode: 200,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log("Response Status:", this.statusCode);
                console.log("Response Data:", JSON.stringify(data, null, 2));
            }
        };

        await PasskeyController.generateLoginOptions(req, res);
    } catch (e) {
        console.error("Caught error in test wrapper:", e);
    } finally {
        process.exit(0);
    }
}

test();
