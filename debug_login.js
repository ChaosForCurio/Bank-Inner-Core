require('dotenv').config();
const { sql } = require('./src/db');
const bcrypt = require('bcryptjs');

async function deepDebug() {
    try {
        // 1. Check the raw users table schema for password column
        const cols = await sql`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `;
        console.log('=== users table columns ===');
        cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}${c.character_maximum_length ? `(${c.character_maximum_length})` : ''}`));

        // 2. Get the actual stored password for a real user
        const users = await sql`SELECT id, email, password, status FROM users ORDER BY id DESC LIMIT 3`;
        console.log('\n=== latest users (raw) ===');
        users.forEach(u => {
            console.log(`  id=${u.id} | email=${u.email} | status=${u.status}`);
            console.log(`  password (first 60): "${u.password?.substring(0, 60)}"`);
            console.log(`  password length: ${u.password?.length}`);
        });

        // 3. Try to register a fresh test user and see what comes back
        const testEmail = `debug_test_${Date.now()}@test.com`;
        const testPassword = 'SuperSecret123!';
        const hash = await bcrypt.hash(testPassword, 10);
        
        const newUser = await sql`
            INSERT INTO users (email, password, name, status, role, is_system)
            VALUES (${testEmail}, ${hash}, ${'Debug User'}, ${'active'}, ${'user'}, ${false})
            RETURNING id, email, password, name
        `;
        const created = newUser[0];
        console.log('\n=== freshly inserted user ===');
        console.log('  email:', created.email);
        console.log('  stored hash (full):', created.password);
        console.log('  hash length:', created.password?.length);
        
        // 4. Now try bcrypt compare on the freshly stored hash
        const match = await bcrypt.compare(testPassword, created.password);
        console.log('  bcrypt compare (same session):', match);
        
        // 5. Re-fetch via SELECT and try again
        const refetch = await sql`SELECT password FROM users WHERE id = ${created.id}`;
        const storedPwd = refetch[0]?.password;
        console.log('  re-fetched hash:', storedPwd);
        console.log('  re-fetched hash length:', storedPwd?.length);
        const match2 = await bcrypt.compare(testPassword, storedPwd);
        console.log('  bcrypt compare (re-fetched):', match2);
        
        // 6. Cleanup
        await sql`DELETE FROM users WHERE id = ${created.id}`;
        console.log('\n✅ Debug user cleaned up');

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message, e.stack);
        process.exit(1);
    }
}
deepDebug();
