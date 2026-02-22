const TransactionModel = require("../models/transaction.model")
const LedgerModel = require("../models/ledger.model")
const AccountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const { sql } = require("../db");

/**
 * createTransaction - Standard user-to-user transfer
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, toUserUuid, amount, type, idempotencyKey } = req.body;

    if (!fromAccount || (!toAccount && !toUserUuid) || !amount || !type || !idempotencyKey) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const UserModel = require("../models/user.model");
        // 1. Verify fromAccount belongs to user
        const fromAcc = await AccountModel.findById(fromAccount);
        if (!fromAcc || fromAcc.user_id !== req.user.id) {
            return res.status(404).json({ message: "From account not found or access denied" });
        }

        // 2. Resolve toAccount if UUID is provided
        let targetAccountId = toAccount;
        if (toUserUuid) {
            const targetUser = await UserModel.findByUuid(toUserUuid);
            if (!targetUser) {
                return res.status(404).json({ message: "Recipient user not found" });
            }
            const primaryAcc = await AccountModel.findPrimaryByUserId(targetUser.id);
            if (!primaryAcc) {
                return res.status(404).json({ message: "Recipient has no active bank account" });
            }
            targetAccountId = primaryAcc.id;
        }

        const toAcc = await AccountModel.findById(targetAccountId);
        if (!toAcc) {
            return res.status(404).json({ message: "Destination account not found" });
        }

        if (fromAcc.status !== "active" || toAcc.status !== "active") {
            return res.status(400).json({ message: "One or both accounts are not active" });
        }

        if (parseFloat(fromAcc.balance) < parseFloat(amount)) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Sequential SQL calls (Neon Serverless HTTP driver pattern)
        // A. Create transaction record
        const transaction = await TransactionModel.create({
            fromAccount, toAccount: targetAccountId, amount, type, idempotencyKey, status: 'pending'
        });

        // B. Update balances (ensure deduction from sender and increase for recipient)
        const updatedFrom = await sql`
            UPDATE accounts 
            SET balance = balance - ${amount}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${fromAccount} AND balance >= ${amount}
            RETURNING balance
        `;

        if (updatedFrom.length === 0) {
            await TransactionModel.updateStatus(transaction.id, 'failed');
            return res.status(400).json({ message: "Insufficient balance at time of execution" });
        }

        const updatedTo = await sql`
            UPDATE accounts 
            SET balance = balance + ${amount}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${targetAccountId}
            RETURNING balance
        `;

        if (updatedTo.length === 0) {
            // Rollback balance deduction if recipient update fails
            await sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${fromAccount}`;
            await TransactionModel.updateStatus(transaction.id, 'failed');
            return res.status(500).json({ message: "Recipient account update failed" });
        }

        // C. Create Ledger entries
        await LedgerModel.create({
            accountId: fromAccount,
            transactionId: transaction.id,
            amount,
            type: "debit",
            balance: updatedFrom[0].balance,
            description: `Transfer to account ${targetAccountId}`
        });

        await LedgerModel.create({
            accountId: targetAccountId,
            transactionId: transaction.id,
            amount,
            type: "credit",
            balance: updatedTo[0].balance,
            description: `Transfer from account ${fromAccount}`
        });

        // D. Complete transaction
        const finalTransaction = await TransactionModel.updateStatus(transaction.id, 'completed');

        // Notifications (non-blocking)
        emailService.sendTransactionEmail(req.user.email, req.user.name, req.user.id, {
            amount, type: "debit", toAccount: targetAccountId, transactionId: transaction.id
        }).catch(console.error);

        return res.status(201).json({
            message: "Transaction successful",
            status: "success",
            data: finalTransaction
        });

    } catch (error) {
        console.error("Transaction controller error:", error);
        return res.status(500).json({ message: "Transaction failed", error: error.message });
    }
}

/**
 * createInitialFundsTransaction - System-to-user credit
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount, and idempotencyKey are required"
        });
    }

    try {
        // 1. Get destination account
        const toUserAccount = await AccountModel.findById(toAccount);
        if (!toUserAccount) {
            return res.status(404).json({ message: "Destination account not found" });
        }

        if (toUserAccount.status !== "active") {
            return res.status(400).json({ message: "Destination account is not active" });
        }

        // 2. Get system user's account with matching currency
        const systemAccounts = await AccountModel.findByUserId(req.user.id);
        const fromAcc = systemAccounts.find(acc => acc.currency === toUserAccount.currency);

        if (!fromAcc) {
            return res.status(404).json({ message: "System account with matching currency not found" });
        }

        // A. Create transaction record
        const transaction = await TransactionModel.create({
            fromAccount: fromAcc.id,
            toAccount,
            amount,
            type: 'credit',
            idempotencyKey,
            status: 'pending'
        });

        // B. Update balances (ensure deduction from system and increase for user)
        const updatedFrom = await sql`
            UPDATE accounts 
            SET balance = balance - ${amount}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${fromAcc.id} AND balance >= ${amount}
            RETURNING balance
        `;

        if (updatedFrom.length === 0) {
            await TransactionModel.updateStatus(transaction.id, 'failed');
            return res.status(400).json({ message: "System account has insufficient funds" });
        }

        const updatedTo = await sql`
            UPDATE accounts 
            SET balance = balance + ${amount}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${toAccount}
            RETURNING balance
        `;

        if (updatedTo.length === 0) {
            // Rollback system deduction if user update fails
            await sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${fromAcc.id}`;
            await TransactionModel.updateStatus(transaction.id, 'failed');
            return res.status(500).json({ message: "Recipient account update failed" });
        }

        // C. Create Ledger entries
        await LedgerModel.create({
            accountId: fromAcc.id,
            transactionId: transaction.id,
            amount,
            type: "debit",
            balance: updatedFrom[0].balance,
            description: `System payout to account ${toAccount}`
        });

        await LedgerModel.create({
            accountId: toAccount,
            transactionId: transaction.id,
            amount,
            type: "credit",
            balance: updatedTo[0].balance,
            description: 'System initial funding'
        });

        // D. Complete transaction
        const finalTransaction = await TransactionModel.updateStatus(transaction.id, 'completed');

        return res.status(201).json({
            message: "Initial funds added successfully",
            status: "success",
            data: finalTransaction
        });

    } catch (error) {
        console.error("Initial funds error:", error);
        return res.status(500).json({ message: "Failed to add initial funds", error: error.message });
    }
}

/**
 * getTransactionHistory - Fetch all ledger entries for user's accounts
 */
async function getTransactionHistory(req, res) {
    try {
        const userId = req.user.id;

        // 1. Get all accounts for this user
        const accounts = await AccountModel.findByUserId(userId);
        const accountIds = accounts.map(acc => acc.id);

        if (accountIds.length === 0) {
            return res.status(200).json({ status: "success", transactions: [] });
        }

        // 2. Fetch history from Ledgers (since it handles credits/debits per account)
        // We'll join with transactions to get more details if needed, 
        // but for now, the ledger entries have the main info.
        const history = await sql`
            SELECT 
                l.*, 
                t.type as transaction_type,
                t.from_account,
                t.to_account,
                t.status as transaction_status
            FROM ledgers l
            JOIN transactions t ON l.transaction_id = t.id
            WHERE l.account_id = ANY(${accountIds})
            ORDER BY l.created_at DESC
        `;

        return res.status(200).json({
            status: "success",
            transactions: history
        });
    } catch (error) {
        console.error("Get history error:", error);
        return res.status(500).json({ message: "Failed to retrieve transaction history" });
    }
}

/**
 * getTransactionById - Fetch single transaction details
 */
async function getTransactionById(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Fetch transaction
        const transaction = await sql`
            SELECT * FROM transactions WHERE id = ${id}
        `;

        if (transaction.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // 2. Verify user has access (must be sender or receiver)
        const accounts = await AccountModel.findByUserId(userId);
        const accountIds = accounts.map(acc => acc.id);

        if (!accountIds.includes(transaction[0].from_account) && !accountIds.includes(transaction[0].to_account)) {
            return res.status(403).json({ message: "Access denied" });
        }

        // 3. Get ledger entries for context
        const ledgers = await sql`
            SELECT * FROM ledgers WHERE transaction_id = ${id}
        `;

        return res.status(200).json({
            status: "success",
            transaction: transaction[0],
            ledgers
        });
    } catch (error) {
        console.error("Get transaction by ID error:", error);
        return res.status(500).json({ message: "Failed to retrieve transaction details" });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistory,
    getTransactionById
};
