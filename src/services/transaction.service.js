const { sql } = require("../db");
const TransactionModel = require("../models/transaction.model");
const LedgerModel = require("../models/ledger.model");
const AccountModel = require("../models/account.model");
const PushService = require("./push.service");

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
            
            // E. Send Push Notification to recipient (non-blocking)
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

            return finalTransaction;
        } catch (error) {
            console.error("TransactionService Error:", error.message);
            throw error;
        }
    }
};

module.exports = TransactionService;
