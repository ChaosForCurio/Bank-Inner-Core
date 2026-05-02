const { sql } = require("../db");
const TransactionModel = require("../models/transaction.model");
const LedgerModel = require("../models/ledger.model");
const AccountModel = require("../models/account.model");
const PushService = require("./push.service");
const VaultModel = require("../models/vault.model");
const SocketService = require("./socket.service");

const TransactionService = {
    /**
     * executeTransfer - Core logic for moving money between accounts
     * Handles balance updates and ledger entries.
     */
    async executeTransfer({ fromAccountId, toAccountId, amount, type, idempotencyKey, description }) {
        try {
            // A. Create transaction record
            const transaction = await TransactionModel.create({
                fromAccount: fromAccountId, 
                toAccount: toAccountId, 
                amount, 
                type, 
                idempotencyKey, 
                status: 'pending'
            });

            // B. Update balances (ensure deduction from sender and increase for recipient)
            const updatedFrom = await sql`
                UPDATE accounts 
                SET balance = balance - ${amount}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${fromAccountId} AND balance >= ${amount} AND status = 'active'
                RETURNING balance
            `;

            if (updatedFrom.length === 0) {
                await TransactionModel.updateStatus(transaction.id, 'failed');
                throw new Error("Insufficient balance or account inactive");
            }

            const updatedTo = await sql`
                UPDATE accounts 
                SET balance = balance + ${amount}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${toAccountId} AND status = 'active'
                RETURNING balance
            `;

            if (updatedTo.length === 0) {
                // Rollback balance deduction if recipient update fails
                await sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${fromAccountId}`;
                await TransactionModel.updateStatus(transaction.id, 'failed');
                throw new Error("Recipient account update failed or inactive");
            }

            // C. Create Ledger entries
            await LedgerModel.create({
                accountId: fromAccountId,
                transactionId: transaction.id,
                amount,
                type: "debit",
                balance: updatedFrom[0].balance,
                description: description || `Transfer to account ${toAccountId}`
            });

            await LedgerModel.create({
                accountId: toAccountId,
                transactionId: transaction.id,
                amount,
                type: "credit",
                balance: updatedTo[0].balance,
                description: description || `Transfer from account ${fromAccountId}`
            });

            // D. Complete transaction
            const finalTransaction = await TransactionModel.updateStatus(transaction.id, 'completed');
            
            // E. Handle Round-up (Premium Feature)
            try {
                const amountNum = parseFloat(amount);
                const nextWhole = Math.ceil(amountNum);
                const roundUp = nextWhole - amountNum;

                if (roundUp > 0 && roundUp < 1) {
                    const senderAccount = await AccountModel.findById(fromAccountId);
                    if (senderAccount) {
                        const vaults = await VaultModel.findByUserId(senderAccount.user_id);
                        const targetVault = vaults.find(v => v.name.toLowerCase().includes('general') || v.name.toLowerCase().includes('savings')) || vaults[0];

                        if (targetVault && parseFloat(senderAccount.balance) >= roundUp) {
                            // Execute round-up
                            await AccountModel.updateBalance(fromAccountId, -roundUp);
                            await VaultModel.updateBalance(targetVault.id, roundUp);
                            
                            // Log the round-up in ledger
                            await LedgerModel.create({
                                accountId: fromAccountId,
                                transactionId: transaction.id,
                                amount: roundUp,
                                type: "debit",
                                balance: parseFloat(senderAccount.balance) - roundUp,
                                description: `Round-up contribution to ${targetVault.name}`
                            });
                        }
                    }
                }
            } catch (roundUpError) {
                console.error("Round-up check failed:", roundUpError);
            }

            // F. Send Push Notification to recipient (non-blocking)
            try {
                // We need to resolve the toAccountId to a userId
                const targetAccount = await AccountModel.findById(toAccountId);
                if (targetAccount && targetAccount.user_id) {
                    PushService.sendToUser(targetAccount.user_id, {
                        title: "Funds Received",
                        body: `You received ₹${parseFloat(amount).toLocaleString('en-IN')} in your account.`,
                        icon: "/bank-icon-192.png", // Or similar, adjust paths
                        url: `/dashboard/history?tx=${transaction.id}`
                    }).catch(err => console.error("Push dispatch error:", err));
                }
            } catch (notifyError) {
                console.error("Error setting up recipient notification:", notifyError);
            }

            // G. Real-time Socket Updates
            try {
                // Sender update
                const senderAccount = await AccountModel.findById(fromAccountId);
                if (senderAccount) {
                    SocketService.emitToUser(senderAccount.user_id, 'balance_update', {
                        accountId: fromAccountId,
                        balance: updatedFrom[0].balance
                    });
                    SocketService.emitToUser(senderAccount.user_id, 'new_transaction', finalTransaction);
                }

                // Recipient update
                const recipientAccount = await AccountModel.findById(toAccountId);
                if (recipientAccount) {
                    SocketService.emitToUser(recipientAccount.user_id, 'balance_update', {
                        accountId: toAccountId,
                        balance: updatedTo[0].balance
                    });
                    SocketService.emitToUser(recipientAccount.user_id, 'new_transaction', finalTransaction);
                }
            } catch (socketError) {
                console.error("Socket dispatch error:", socketError);
            }

            return finalTransaction;
        } catch (error) {
            console.error("TransactionService Error:", error.message);
            throw error;
        }
    },

    /**
     * executeExchange - Handles currency conversion between two accounts owned by the same user
     */
    async executeExchange({ userId, fromAccountId, toAccountId, sourceAmount, targetAmount, exchangeRate, fromCurrency, toCurrency }) {
        try {
            // A. Create transaction record with extra exchange metadata
            const transaction = await sql`
                INSERT INTO transactions (
                    from_account_id, 
                    to_account_id, 
                    amount, 
                    type, 
                    status,
                    exchange_rate,
                    source_amount,
                    target_amount
                ) VALUES (
                    ${fromAccountId}, 
                    ${toAccountId}, 
                    ${targetAmount}, 
                    'exchange', 
                    'pending',
                    ${exchangeRate},
                    ${sourceAmount},
                    ${targetAmount}
                ) RETURNING *
            `;

            const tx = transaction[0];

            // B. Update Source Account (Deduct)
            const updatedFrom = await sql`
                UPDATE accounts 
                SET balance = balance - ${sourceAmount}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${fromAccountId} AND user_id = ${userId} AND balance >= ${sourceAmount} AND status = 'active'
                RETURNING balance
            `;

            if (updatedFrom.length === 0) {
                await sql`UPDATE transactions SET status = 'failed' WHERE id = ${tx.id}`;
                throw new Error("Insufficient balance in source account or account not found");
            }

            // C. Update Target Account (Add)
            const updatedTo = await sql`
                UPDATE accounts 
                SET balance = balance + ${targetAmount}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${toAccountId} AND user_id = ${userId} AND status = 'active'
                RETURNING balance
            `;

            if (updatedTo.length === 0) {
                // Rollback source deduction
                await sql`UPDATE accounts SET balance = balance + ${sourceAmount} WHERE id = ${fromAccountId}`;
                await sql`UPDATE transactions SET status = 'failed' WHERE id = ${tx.id}`;
                throw new Error("Target account update failed or account not found");
            }

            // D. Create Ledger entries
            await LedgerModel.create({
                accountId: fromAccountId,
                transactionId: tx.id,
                amount: sourceAmount,
                type: "debit",
                balance: updatedFrom[0].balance,
                description: `Currency Exchange: ${sourceAmount} ${fromCurrency} to ${targetAmount} ${toCurrency}`
            });

            await LedgerModel.create({
                accountId: toAccountId,
                transactionId: tx.id,
                amount: targetAmount,
                type: "credit",
                balance: updatedTo[0].balance,
                description: `Currency Exchange: Received ${targetAmount} ${toCurrency} from ${fromCurrency} wallet`
            });

            // E. Complete transaction
            const [finalTx] = await sql`UPDATE transactions SET status = 'completed' WHERE id = ${tx.id} RETURNING *`;
            
            // F. Real-time Socket Updates
            try {
                SocketService.emitToUser(userId, 'balance_update', {
                    accountId: fromAccountId,
                    balance: updatedFrom[0].balance
                });
                SocketService.emitToUser(userId, 'balance_update', {
                    accountId: toAccountId,
                    balance: updatedTo[0].balance
                });
                SocketService.emitToUser(userId, 'new_transaction', finalTx);
            } catch (socketError) {
                console.error("Socket dispatch error:", socketError);
            }

            return finalTx;
        } catch (error) {
            console.error("Exchange Execution Error:", error.message);
            throw error;
        }
    }
};

module.exports = TransactionService;
