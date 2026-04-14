const app = require("../src/app");
const request = require("supertest");

async function testCors() {
    console.log("Testing CORS for https://bank-inner-core-4s7p.vercel.app");
    
    // Simulate preflight OPTIONS request
    const response = await request(app)
        .options("/api/health")
        .set("Origin", "https://bank-inner-core-4s7p.vercel.app")
        .set("Access-Control-Request-Method", "GET");

    console.log(`Status: ${response.status}`);
    console.log("Headers:");
    Object.keys(response.headers).forEach(k => {
        if (k.toLowerCase().includes("access-control")) {
            console.log(`  ${k}: ${response.headers[k]}`);
        }
    });

    if (response.headers["access-control-allow-origin"] === "https://bank-inner-core-4s7p.vercel.app") {
        console.log("✅ CORS test passed!");
    } else {
        console.log("❌ CORS test failed.");
    }

    process.exit(0);
}

testCors();
