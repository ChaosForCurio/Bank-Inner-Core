require('dotenv').config();
const { sql } = require('./src/db');
sql`SELECT id, uuid, email FROM users LIMIT 5`
    .then(console.log)
    .catch(console.error)
    .finally(() => process.exit());
