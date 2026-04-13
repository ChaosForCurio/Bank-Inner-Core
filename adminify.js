require("dotenv").config();
const { sql } = require("./src/db");
const bcrypt = require("bcryptjs");

async function adminify() {
    try {
        const email = "system@bank.com";
        const password = "Admin@123";
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await sql`
            UPDATE users 
            SET role = 'admin', password = ${hashedPassword} 
            WHERE email = ${email} 
            RETURNING id, role
        `;
        
        if (result.length > 0) {
            console.log(`User ${email} is now an admin with password Admin@123`);
        } else {
            console.log(`User ${email} not found. Creating...`);
            await sql`
                INSERT INTO users (email, password, name, status, role, is_system)
                VALUES (${email}, ${hashedPassword}, 'System', 'active', 'admin', true)
            `;
            console.log(`User ${email} created as admin with password Admin@123`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
adminify();
