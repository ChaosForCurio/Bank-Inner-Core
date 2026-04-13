const { sql } = require("../db");

const AdminController = {
    /**
     * getDashboardStats - System-wide overview
     */
    async getDashboardStats(req, res) {
        try {
            const stats = await sql`
                SELECT 
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT SUM(balance) FROM accounts) as total_assets,
                    (SELECT COUNT(*) FROM transactions WHERE status = 'completed') as completed_transactions,
                    (SELECT COUNT(*) FROM accounts WHERE status = 'frozen') as frozen_accounts
            `;

            return res.status(200).json({
                status: "success",
                stats: stats[0]
            });
        } catch (error) {
            console.error("Admin stats error:", error);
            return res.status(500).json({ message: "Failed to retrieve system stats" });
        }
    },

    /**
     * getAllUsers - List all users and their details
     */
    async getAllUsers(req, res) {
        try {
            const users = await sql`
                SELECT u.id, u.uuid, u.email, u.name, u.status, u.role, u.created_at,
                       json_agg(a.*) as accounts
                FROM users u
                LEFT JOIN accounts a ON u.id = a.user_id
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `;

            return res.status(200).json({
                status: "success",
                users
            });
        } catch (error) {
            console.error("Admin get users error:", error);
            return res.status(500).json({ message: "Failed to retrieve users" });
        }
    },

    /**
     * getGlobalHistory - View all system transactions
     */
    async getGlobalHistory(req, res) {
        const { limit = 50, offset = 0 } = req.query;
        try {
            const transactions = await sql`
                SELECT t.*, 
                       uf.name as from_user_name, 
                       ut.name as to_user_name
                FROM transactions t
                LEFT JOIN accounts af ON t.from_account = af.id
                LEFT JOIN users uf ON af.user_id = uf.id
                LEFT JOIN accounts at ON t.to_account = at.id
                LEFT JOIN users ut ON at.user_id = ut.id
                ORDER BY t.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

            return res.status(200).json({
                status: "success",
                transactions
            });
        } catch (error) {
            console.error("Admin get history error:", error);
            return res.status(500).json({ message: "Failed to retrieve global history" });
        }
    },

    /**
     * updateAccountStatus - Freeze/Unfreeze account
     */
    async updateAccountStatus(req, res) {
        const { accountId } = req.params;
        const { status } = req.body;

        if (!['active', 'frozen', 'closed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        try {
            const updated = await sql`
                UPDATE accounts 
                SET status = ${status}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${accountId}
                RETURNING *
            `;

            if (updated.length === 0) {
                return res.status(404).json({ message: "Account not found" });
            }

            return res.status(200).json({
                status: "success",
                message: `Account status updated to ${status}`,
                account: updated[0]
            });
        } catch (error) {
            console.error("Admin update account error:", error);
            return res.status(500).json({ message: "Failed to update account status" });
        }
    }
};

module.exports = AdminController;
