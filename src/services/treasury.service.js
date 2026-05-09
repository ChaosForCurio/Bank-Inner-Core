const { sql } = require("../db");
const VaultModel = require("../models/vault.model");
const AccountModel = require("../models/account.model");
const LedgerModel = require("../models/ledger.model");

const TreasuryService = {
    /**
     * executeWithholding - Transfer a percentage of income to a tax vault
     */
    async executeWithholding(userId, amount, category) {
        const incomeCategories = ['Salary', 'Freelance', 'Dividend', 'Interest', 'Bonus'];
        if (!incomeCategories.includes(category)) return;

        try {
            const users = await sql`SELECT treasury_config FROM users WHERE id = ${userId}`;
            const config = users[0]?.treasury_config;
            
            if (!config || !config.is_enabled) return;

            const percentage = config.tax_withholding_percentage || 25;
            const withholdingAmount = (amount * percentage) / 100;

            if (withholdingAmount <= 0) return;

            // Find Tax Vault
            const vaults = await VaultModel.findByUserId(userId);
            let taxVault = vaults.find(v => v.is_tax_vault);

            if (!taxVault) {
                // Auto-create tax vault if it doesn't exist
                taxVault = await VaultModel.create({
                    userId,
                    name: "Tax Treasury",
                    targetAmount: 0,
                    emoji: "⚖️",
                    color: "#FF4D4D"
                });
                await sql`UPDATE vaults SET is_tax_vault = true WHERE id = ${taxVault.id}`;
            }

            // Find main account to deduct from
            const accounts = await AccountModel.findByUserId(userId);
            const mainAccount = accounts.find(a => a.status === 'active');

            if (mainAccount && mainAccount.balance >= withholdingAmount) {
                // Perform the transfer
                await AccountModel.updateBalance(mainAccount.id, -withholdingAmount);
                await VaultModel.updateBalance(taxVault.id, withholdingAmount);

                // Update ledger for the account
                await LedgerModel.create({
                    accountId: mainAccount.id,
                    amount: withholdingAmount,
                    type: "debit",
                    balance: parseFloat(mainAccount.balance) - withholdingAmount,
                    description: `Autonomous Tax Withholding (${percentage}%) for ${category} income`
                });

                // Log treasury action
                await sql`
                    INSERT INTO treasury_logs (user_id, action_type, amount, details)
                    VALUES (${userId}, 'WITHHOLDING', ${withholdingAmount}, ${`Auto-taxed ${category} income`})
                `;

                console.log(`[TREASURY] Withheld ${withholdingAmount} for user ${userId} (${category})`);
            }
        } catch (error) {
            console.error("Treasury Withholding Error:", error);
        }
    },

    /**
     * runYieldAggregator - Moves funds from low-interest vaults to the highest-interest vault for a user
     */
    async runYieldAggregator(userId) {
        try {
            const vaults = await VaultModel.findByUserId(userId);
            if (vaults.length < 2) return;

            // Sort by interest rate descending
            const sortedVaults = [...vaults].sort((a, b) => b.interest_rate - a.interest_rate);
            const highestVault = sortedVaults[0];

            if (parseFloat(highestVault.interest_rate) <= 0) return;

            let totalMoved = 0;
            for (let i = 1; i < sortedVaults.length; i++) {
                const vault = sortedVaults[i];
                if (parseFloat(vault.interest_rate) < parseFloat(highestVault.interest_rate) && parseFloat(vault.current_amount) > 0) {
                    const amountToMove = parseFloat(vault.current_amount);
                    await VaultModel.updateBalance(vault.id, -amountToMove);
                    await VaultModel.updateBalance(highestVault.id, amountToMove);
                    totalMoved += amountToMove;
                }
            }

            if (totalMoved > 0) {
                await sql`
                    INSERT INTO treasury_logs (user_id, action_type, amount, details)
                    VALUES (${userId}, 'YIELD_OPTIMIZATION', ${totalMoved}, ${`Aggregated funds into ${highestVault.name} (${highestVault.interest_rate}%)`})
                `;
                console.log(`[TREASURY] Optimized yield for user ${userId}: moved ${totalMoved} to ${highestVault.name}`);
            }
        } catch (error) {
            console.error("Yield Aggregator Error:", error);
        }
    },

    /**
     * runThresholdSweep - Automatically pushes surplus funds above a threshold to an external "Investing" account
     */
    async runThresholdSweep(userId) {
        try {
            const users = await sql`SELECT treasury_config FROM users WHERE id = ${userId}`;
            const config = users[0]?.treasury_config;
            
            if (!config || !config.is_enabled || !config.sweep_threshold) return;

            const accounts = await AccountModel.findByUserId(userId);
            const mainAccount = accounts.find(a => a.status === 'active');

            if (mainAccount && parseFloat(mainAccount.balance) > parseFloat(config.sweep_threshold)) {
                const surplus = parseFloat(mainAccount.balance) - parseFloat(config.sweep_threshold);
                
                // Logic to "Push to external account" or a specific internal "Investing" account
                // For this implementation, we move it to a special "Investing" vault
                let investingVault = (await VaultModel.findByUserId(userId)).find(v => v.name.toLowerCase().includes('investing'));
                
                if (!investingVault) {
                    investingVault = await VaultModel.create({
                        userId,
                        name: "Threshold Investing",
                        targetAmount: 0,
                        emoji: "📈",
                        color: "#4CAF50"
                    });
                }

                await AccountModel.updateBalance(mainAccount.id, -surplus);
                await VaultModel.updateBalance(investingVault.id, surplus);

                await LedgerModel.create({
                    accountId: mainAccount.id,
                    amount: surplus,
                    type: "debit",
                    balance: parseFloat(mainAccount.balance) - surplus,
                    description: `Autonomous Threshold Sweep: surplus above ${config.sweep_threshold} moved to investing`
                });

                await sql`
                    INSERT INTO treasury_logs (user_id, action_type, amount, details)
                    VALUES (${userId}, 'THRESHOLD_SWEEP', ${surplus}, ${`Moved surplus above ${config.sweep_threshold} to investing`})
                `;
                console.log(`[TREASURY] Swept ${surplus} to investing for user ${userId}`);
            }
        } catch (error) {
            console.error("Threshold Sweep Error:", error);
        }
    }
};

module.exports = TreasuryService;
