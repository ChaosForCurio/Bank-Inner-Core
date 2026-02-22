const app = require("../src/app");
const { verifyConnection } = require("../src/db");

// Optional: Warm up connection if needed, though serverless is event-driven
// verifyConnection().catch(err => console.error("DB connection error in Vercel:", err));

module.exports = app;
