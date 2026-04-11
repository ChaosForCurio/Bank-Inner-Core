const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  try {
    console.log("Adding webauthn_challenge to users...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS webauthn_challenge TEXT;`;
    
    console.log("Ensuring mfa_enabled column exists...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;`;

    console.log("Migration successful.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
