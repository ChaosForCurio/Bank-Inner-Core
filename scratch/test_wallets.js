require('dotenv').config();
const ExchangeService = require('../src/services/exchange.service');
const ExchangeController = require('../src/controllers/exchange.controller');

async function runTest() {
    console.log("--- Testing ExchangeService.getRates ---");
    try {
        const ratesInr = await ExchangeService.getRates("INR");
        console.log("Rates (INR base):", ratesInr);
        
        const ratesUsd = await ExchangeService.getRates("USD");
        console.log("Rates (USD base):", ratesUsd);
    } catch (err) {
        console.error("getRates failed:", err);
    }

    console.log("\n--- Testing ExchangeService.convert ---");
    try {
        const conv = await ExchangeService.convert(100, "INR", "USD");
        console.log("Conversion (100 INR to USD):", conv);
        
        const same = await ExchangeService.convert(100, "USD", "USD");
        console.log("Conversion (100 USD to USD):", same);
    } catch (err) {
        console.error("convert failed:", err);
    }

    console.log("\n--- Testing ExchangeController.preview (mocked) ---");
    const req = { body: { from: "INR", to: "EUR", amount: 500 } };
    const res = {
        json: (data) => console.log("Controller Preview Response:", JSON.stringify(data, null, 2)),
        status: (code) => {
            console.log("Status Code:", code);
            return res;
        }
    };
    
    try {
        await ExchangeController.preview(req, res);
    } catch (err) {
        console.error("Controller preview failed:", err);
    }

    console.log("\nVerification complete.");
    process.exit(0);
}

runTest();
