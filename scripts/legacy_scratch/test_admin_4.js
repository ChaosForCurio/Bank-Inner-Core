require('dotenv').config();
const { generateAccessToken } = require('../src/utils/token.util');
const { sql } = require('../src/db');

async function run() {
    const [user] = await sql`SELECT * FROM users WHERE email='system@bank.com'`;
    if (!user) return console.log('not found');
    const token = generateAccessToken(user);
    console.log('Token created:', token);
    
    let res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Admin Stats Response:', await res.text());
    
    res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json2Text = await res.text();
    try { 
        const json2 = JSON.parse(json2Text); 
        console.log('Admin Users Response:', json2.users ? json2.users.length + ' users' : json2Text); 
    } catch(e) { 
        console.log('users res fail:', json2Text); 
    }
    
    res = await fetch('http://localhost:5000/api/admin/history', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json3Text = await res.text();
    console.log('Admin History Response:', json3Text.substring(0, 200));

    process.exit(0);
}
run().catch(console.error);
