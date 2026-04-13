const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { sql } = require("../src/db");

async function checkSchema() {
  try {
    const usersCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
    console.log("Users columns:", JSON.stringify(usersCols, null, 2));

    const passkeysCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'passkeys'
    `;
    console.log("Passkeys columns:", JSON.stringify(passkeysCols, null, 2));
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkSchema();
