const crypto = require('crypto');

/**
 * VirtualCardService - Logic for generating virtual banking cards
 */
const VirtualCardService = {
    /**
     * generateCardNumber - Generates a 16-digit card number (simulated)
     */
    generateCardNumber() {
        // Simulated BIN (Bank Identification Number) for Xieriee Core
        const bin = "453278"; 
        let number = bin;
        while (number.length < 16) {
            number += crypto.randomInt(0, 10).toString();
        }
        return number;
    },

    /**
     * generateCVV - Generates a 3-digit CVV
     */
    generateCVV() {
        return crypto.randomInt(100, 1000).toString();
    },

    /**
     * generateExpiry - Generates an expiry date (3 years from now)
     */
    generateExpiry() {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear() + 3).slice(-2);
        return `${month}/${year}`;
    },

    /**
     * generateProxyIdentity - Generates a burner email and phone number
     */
    generateProxyIdentity() {
        const randomHex = crypto.randomBytes(3).toString('hex');
        return {
            proxyEmail: `proxy-${randomHex}@xieriee-secure.com`,
            proxyPhone: `+1-555-${crypto.randomInt(1000, 10000)}`
        };
    }
};

module.exports = VirtualCardService;
