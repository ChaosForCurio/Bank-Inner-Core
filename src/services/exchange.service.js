/**
 * ExchangeService - Simulated real-time exchange rates
 */
const ExchangeService = {
    // base: INR
    rates: {
        'INR': 1,
        'USD': 0.012,  // 1 INR = 0.012 USD
        'EUR': 0.011,  // 1 INR = 0.011 EUR
        'GBP': 0.0095, // 1 INR = 0.0095 GBP
    },

    /**
     * getRates - Returns all rates relative to a base currency
     */
    getRates(base = "INR") {
        if (base === "INR") return this.rates;
        
        const baseInr = 1 / this.rates[base];
        const crossRates = {};
        
        Object.keys(this.rates).forEach(curr => {
            crossRates[curr] = this.rates[curr] * baseInr;
        });
        
        return crossRates;
    },

    /**
     * getRate - Get conversion rate from one currency to another
     * @param {string} fromCurrency 
     * @param {string} toCurrency 
     */
    async getRate(fromCurrency, toCurrency) {
        if (!this.rates[fromCurrency] || !this.rates[toCurrency]) {
            throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
        }
        
        // In a real app, this would fetch from an external API (e.g., Fixer.io, OpenExchangeRates)
        const fromInr = 1 / this.rates[fromCurrency];
        const toInr = this.rates[toCurrency];
        
        // Add a small simulated "spread" or fluctuation (+/- 0.5%)
        const fluctuation = 1 + (Math.random() * 0.01 - 0.005);
        
        return (fromInr * toInr) * fluctuation;
    },

    /**
     * convert - Returns conversion object with metadata
     */
    async convert(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return {
                sourceAmount: parseFloat(amount),
                targetAmount: parseFloat(amount),
                rate: 1,
                from: fromCurrency,
                to: toCurrency
            };
        }
        
        const rate = await this.getRate(fromCurrency, toCurrency);
        const targetAmount = parseFloat(amount) * rate;
        
        return {
            sourceAmount: parseFloat(amount),
            targetAmount: parseFloat(targetAmount.toFixed(2)),
            rate: parseFloat(rate.toFixed(6)),
            from: fromCurrency,
            to: toCurrency
        };
    }
};

module.exports = ExchangeService;
