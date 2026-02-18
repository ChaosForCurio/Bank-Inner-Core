require('dotenv').config();
const { sql } = require('../db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        const email = 'testuser@example.com';
        const password = 'password123';
        const name = 'Test User';

        // Check if user exists
        const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (existingUsers.length > 0) {
            console.log(`User ${email} already exists.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await sql`
            INSERT INTO users (email, password, name)
            VALUES (${email}, ${hashedPassword}, ${name})
            RETURNING id, email, name
        `;

        console.log('Test user created:', newUser[0]);
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        process.exit();
    }
}

createTestUser();
