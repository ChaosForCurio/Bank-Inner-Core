const ApprovalService = require("../services/approval.service");

class ApprovalController {
    /**
     * approve - Approve a pending transaction
     */
    async approve(req, res) {
        try {
            const { transactionId } = req.body;
            const approverId = req.user.id; // From auth middleware

            if (!transactionId) {
                return res.status(400).json({ error: "Transaction ID is required" });
            }

            const result = await ApprovalService.approveTransaction(transactionId, approverId);
            res.status(200).json(result);
        } catch (error) {
            console.error("Error in ApprovalController.approve:", error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * reject - Reject a pending transaction
     */
    async reject(req, res) {
        try {
            const { transactionId, reason } = req.body;
            const rejectorId = req.user.id;

            if (!transactionId) {
                return res.status(400).json({ error: "Transaction ID is required" });
            }

            const result = await ApprovalService.rejectTransaction(transactionId, rejectorId, reason);
            res.status(200).json(result);
        } catch (error) {
            console.error("Error in ApprovalController.reject:", error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * getPendingApprovals - Get pending approvals for a user
     */
    async getPendingApprovals(req, res) {
        try {
            // This would likely involve checking which transactions the user is authorized to approve
            // For now, let's just return all pending approvals for simplicity, 
            // but in a real system, you'd filter by role/permissions.
            const { sql } = require("../db");
            const approvals = await sql`
                SELECT a.*, t.amount, t.type, t.from_account, t.to_account
                FROM transaction_approvals a
                JOIN transactions t ON a.transaction_id = t.id
                WHERE a.status = 'pending'
                ORDER BY a.created_at DESC
            `;
            res.status(200).json(approvals);
        } catch (error) {
            console.error("Error in ApprovalController.getPendingApprovals:", error);
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new ApprovalController();
