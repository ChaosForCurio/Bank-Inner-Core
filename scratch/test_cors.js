/**
 * Simple test script to verify CORS logic in app.js
 */
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://bank-inner-core-4s7p.vercel.app",
    "https://bank-inner-core-3.onrender.com",
    "https://bank-inner-core-4s7p-kkd5fojss-chaosforcurios-projects.vercel.app"
];

function checkOrigin(origin) {
    if (!origin || allowedOrigins.includes(origin)) {
        return true;
    }
    if (origin.startsWith('https://bank-inner-core-4s7p') && origin.endsWith('.vercel.app')) {
        return true;
    }
    return false;
}

const testOrigins = [
    "http://localhost:3000", // Should be true
    "https://bank-inner-core-4s7p.vercel.app", // Should be true
    "https://bank-inner-core-4s7p-some-hash.vercel.app", // Should be true (wildcard)
    "https://other-app.vercel.app", // Should be false
    "https://malicious.com" // Should be false
];

testOrigins.forEach(origin => {
    console.log(`Origin: ${origin} -> Allowed: ${checkOrigin(origin)}`);
});
