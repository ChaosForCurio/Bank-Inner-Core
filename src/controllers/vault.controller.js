const VaultModel = require('../models/vault.model');
const AccountModel = require('../models/account.model');
const TransactionModel = require('../models/transaction.model');

const VaultController = {
    async createVault(req, res) {
        try {
            const { name, targetAmount, emoji, color } = req.body;
            const userId = req.user.id;

            if (!name || targetAmount === undefined) {
                return res.status(400).json({ message: 'Name and target amount are required' });
            }

            const vault = await VaultModel.create({
                userId,
                name,
                targetAmount,
                emoji: emoji || '💰',
                color: color || '#10b981'
            });

            res.status(201).json({ message: 'Vault created successfully', vault });
        } catch (error) {
            console.error('Create vault error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async getVaults(req, res) {
        try {
            const userId = req.user.id;
            const vaults = await VaultModel.findByUserId(userId);
            res.status(200).json({ vaults });
        } catch (error) {
            console.error('Get vaults error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async contributeToVault(req, res) {
        try {
            const { vaultId, amount } = req.body;
            const userId = req.user.id;

            if (!vaultId || !amount || amount <= 0) {
                return res.status(400).json({ message: 'Valid vaultId and amount are required' });
            }

            // 1. Check if user has enough balance in primary account
            const accounts = await AccountModel.findByUserId(userId);
            const primaryAccount = accounts[0];

            if (!primaryAccount || primaryAccount.balance < amount) {
                return res.status(400).json({ message: 'Insufficient funds for contribution' });
            }

            // 2. Update primary account balance (Debit)
            await AccountModel.updateBalance(primaryAccount.id, -amount);

            // 3. Create a transaction record for the debit
            await TransactionModel.create({
                accountId: primaryAccount.id,
                type: 'debit',
                amount,
                description: `Transfer to Vault: ${vaultId}`,
                category: 'Savings'
            });

            // 4. Update vault balance (Credit)
            const updatedVault = await VaultModel.updateBalance(vaultId, amount);

            res.status(200).json({ 
                message: 'Contributed to vault successfully', 
                vault: updatedVault,
                newBalance: primaryAccount.balance - amount
            });
        } catch (error) {
            console.error('Contribute to vault error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async deleteVault(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const vault = await VaultModel.findById(id);
            if (!vault || vault.user_id !== userId) {
                return res.status(404).json({ message: 'Vault not found' });
            }

            // If vault has money, return it to the primary account
            if (vault.current_amount > 0) {
                const accounts = await AccountModel.findByUserId(userId);
                const primaryAccount = accounts[0];
                if (primaryAccount) {
                    await AccountModel.updateBalance(primaryAccount.id, vault.current_amount);
                    await TransactionModel.create({
                        accountId: primaryAccount.id,
                        type: 'credit',
                        amount: vault.current_amount,
                        description: `Return from deleted vault: ${vault.name}`,
                        category: 'Savings'
                    });
                }
            }

            await VaultModel.delete(id, userId);
            res.status(200).json({ message: 'Vault deleted and funds returned' });
        } catch (error) {
            console.error('Delete vault error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = VaultController;
