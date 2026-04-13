require("dotenv").config();
const { sql } = require("./src/db");
async function checkUsers() {
    try {
        const users = await sql`SELECT id, name, email, role FROM users`;
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUsers();
