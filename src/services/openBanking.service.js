const ExternalAccountModel = require("../models/externalAccount.model");

/**
 * OpenBankingService
 * A mock service simulating interactions with an Open Banking provider like Plaid.
 */
const OpenBankingService = {
    /**
     * Generates a link token to initialize the frontend SDK
     */
    async createLinkToken(userId) {
        // MOCK: In a real app, you would call Plaid API: client.linkTokenCreate({...})
        console.log(`[Mock Plaid] Generating Link Token for user ${userId}`);
        
        return {
            link_token: `mock-link-token-${userId}-${Date.now()}`,
            expiration: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        };
    },

    /**
     * Exchanges a public token (from frontend) for a permanent access token
     */
    async exchangePublicToken(userId, publicToken, institutionName = "Mock Bank") {
        // MOCK: In a real app, you would call Plaid API: client.itemPublicTokenExchange({ public_token: publicToken })
        console.log(`[Mock Plaid] Exchanging public token for user ${userId}`);
        
        const mockAccessToken = `mock-access-${Date.now()}`;
        const mockItemId = `mock-item-${Date.now()}`;
        
        // Mock checking accounts
        const accountInfo = {
            accountId: `mock-acc-${Date.now()}`,
            mask: Math.floor(1000 + Math.random() * 9000).toString(),
            type: "checking"
        };

        // Save connection to our database
        const savedAccount = await ExternalAccountModel.create({
            userId,
            institutionName,
            accountId: accountInfo.accountId,
            mask: accountInfo.mask,
            type: accountInfo.type,
            accessToken: mockAccessToken,
            itemId: mockItemId
        });

        return savedAccount;
    },

    /**
     * Fetches real-time balances for an external account
     */
    async getBalances(accountId) {
        // MOCK: In a real app, you would fetch the access_token from DB and call Plaid API: client.accountsBalanceGet({ access_token })
        const accountSecrets = await ExternalAccountModel.getAccountSecrets(accountId);
        
        if (!accountSecrets) {
            throw new Error("External account not found");
        }

        console.log(`[Mock Plaid] Fetching balances for token ${accountSecrets.access_token}`);
        
        // Simulate a balance response
        const randomBalance = (Math.random() * 10000).toFixed(2);
        
        return {
            available: parseFloat(randomBalance),
            current: parseFloat(randomBalance) + 50.00,
            iso_currency_code: "USD",
            last_updated: new Date().toISOString()
        };
    }
};

module.exports = OpenBankingService;
