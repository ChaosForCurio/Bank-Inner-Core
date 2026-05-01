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
            number += Math.floor(Math.random() * 10).toString();
        }
        return number;
    },

    /**
     * generateCVV - Generates a 3-digit CVV
     */
    generateCVV() {
        return Math.floor(Math.random() * 900 + 100).toString();
    },

    /**
     * generateExpiry - Generates an expiry date (3 years from now)
     */
    generateExpiry() {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear() + 3).slice(-2);
        return `${month}/${year}`;
    }
};

module.exports = VirtualCardService;
