const CATEGORY_MAP = {
    'food': ['starbucks', 'mcdonalds', 'uber eats', 'swiggy', 'zomato', 'restaurant', 'cafe', 'grocery', 'supermarket', 'walmart', 'tesco'],
    'transport': ['uber', 'lyft', 'ola', 'taxi', 'train', 'metro', 'bus', 'fuel', 'petrol', 'shell', 'parking'],
    'entertainment': ['netflix', 'spotify', 'disney', 'steam', 'cinema', 'theatre', 'concert'],
    'shopping': ['amazon', 'ebay', 'flipkart', 'apple', 'nike', 'zara', 'h&m'],
    'bills': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'rent', 'mortgage', 'insurance'],
    'savings': ['vault', 'savings', 'investment', 'stock', 'crypto', 'coinbase', 'binance'],
    'transfer': ['transfer', 'p2p', 'venmo', 'cash app', 'zelle']
};

const AIService = {
    /**
     * categorize - Returns a category based on the description
     */
    categorize(description) {
        if (!description) return 'Other';
        
        const desc = description.toLowerCase();
        
        for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
            if (keywords.some(keyword => desc.includes(keyword))) {
                return category.charAt(0).toUpperCase() + category.slice(1);
            }
        }
        
        return 'Other';
    },

    /**
     * refineWithLLM - (Optional) Future implementation using an external LLM for ambiguous descriptions
     */
    async refineWithLLM(description) {
        // Placeholder for future Gemini/OpenAI integration
        return this.categorize(description);
    }
};

module.exports = AIService;
