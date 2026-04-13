require("dotenv").config();
const { sql } = require("./src/db");

async function checkPasskeysSchema() {
  try {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'passkeys'
    `;
    console.log("Passkeys columns:", cols);
  } catch(e) {
    console.error(e);
  }
}
checkPasskeysSchema();
