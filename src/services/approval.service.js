const { sql } = require("../db");
const TransactionModel = require("../models/transaction.model");
const AccountModel = require("../models/account.model");
const LedgerModel = require("../models/ledger.model");
const NotificationController = require("../controllers/notification.controller");

class ApprovalService {
    /**
     * approveTransaction - Approve a pending high-value transaction
     */
    async approveTransaction(transactionId, approverId) {
        // 1. Get approval record
        const approvals = await sql`
            SELECT * FROM transaction_approvals 
            WHERE transaction_id = ${transactionId} AND status = 'pending'
        `;

        if (approvals.length === 0) {
            throw new Error("No pending approval found for this transaction.");
        }

        const approval = approvals[0];

        // 2. Check if already approved by this user
        if (approval.approver_ids.includes(approverId)) {
            throw new Error("You have already approved this transaction.");
        }

        // 3. Update approver list
        const updatedApprovers = [...approval.approver_ids, approverId];
        const isFullyApproved = updatedApprovers.length >= approval.required_count;

        await sql`
            UPDATE transaction_approvals
            SET approver_ids = ${updatedApprovers},
                status = ${isFullyApproved ? 'approved' : 'pending'},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${approval.id}
        `;

        // 4. If fully approved, trigger the ledger update
        if (isFullyApproved) {
            const transaction = await TransactionModel.findById(transactionId);
            
            // Perform the actual balance updates (mirroring TransactionService.executeTransfer)
            const fromAccount = await AccountModel.findById(transaction.from_account);
            const toAccount = await AccountModel.findById(transaction.to_account);

            if (fromAccount.balance < transaction.amount) {
                // If funds are now insufficient, we fail the transaction
                await sql`UPDATE transaction_approvals SET status = 'failed' WHERE id = ${approval.id}`;
                await TransactionModel.updateStatus(transactionId, 'failed');
                throw new Error("Insufficient funds for approved transaction.");
            }

            // Update balances with manual recovery
            const updatedFrom = await sql`
                UPDATE accounts 
                SET balance = balance - ${transaction.amount}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ${fromAccount.id} AND balance >= ${transaction.amount}
                RETURNING balance
            `;

            if (updatedFrom.length === 0) {
                throw new Error("Concurrent balance update failed during approval.");
            }

            const updatedTo = await sql`
                UPDATE accounts 
                SET balance = balance + ${transaction.amount}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ${toAccount.id}
                RETURNING balance
            `;

            if (updatedTo.length === 0) {
                // Recovery
                await sql`UPDATE accounts SET balance = balance + ${transaction.amount} WHERE id = ${fromAccount.id}`;
                throw new Error("Recipient account update failed during approval execution.");
            }

            // Update transaction status
            await TransactionModel.updateStatus(transactionId, 'completed');

            // Create ledger entries
            await LedgerModel.create({
                transactionId,
                accountId: fromAccount.id,
                amount: transaction.amount,
                type: 'debit',
                balance: updatedFrom[0].balance
            });

            await LedgerModel.create({
                transactionId,
                accountId: toAccount.id,
                amount: transaction.amount,
                type: 'credit',
                balance: updatedTo[0].balance
            });

            // Notify User
            await NotificationController.createInternal(
                fromAccount.user_id,
                "Transaction Approved & Executed",
                `Your high-value transfer of ₹${transaction.amount} has been fully approved and completed.`,
                'transaction'
            );
        }

        return { success: true, fullyApproved: isFullyApproved };
    }

    /**
     * rejectTransaction - Reject a pending transaction
     */
    async rejectTransaction(transactionId, rejectorId, reason) {
        const transaction = await TransactionModel.findById(transactionId);
        if (!transaction || transaction.status !== 'approval_pending') {
            throw new Error("Transaction not found or not in pending approval state.");
        }

        await sql`
            UPDATE transaction_approvals
            SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
            WHERE transaction_id = ${transactionId}
        `;

        await TransactionModel.updateStatus(transactionId, 'failed');

        const account = await AccountModel.findById(transaction.from_account);
        await NotificationController.createInternal(
            account.user_id,
            "Transaction Rejected",
            `Your transfer of ₹${transaction.amount} was rejected. Reason: ${reason || 'Not specified'}`,
            'security'
        );

        return { success: true };
    }
}

module.exports = new ApprovalService();
