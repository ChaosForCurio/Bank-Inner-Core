const { sql } = require("../db");

const ScheduledTransferController = {
    /**
     * createScheduledTransfer - Schedule a transfer for late or recurring
     */
    async createScheduledTransfer(req, res) {
        const { fromAccount, toAccount, amount, frequency, nextRunDate } = req.body;
        const userId = req.user.id;

        if (!fromAccount || !toAccount || !amount || !frequency || !nextRunDate) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            // 1. Verify fromAccount belongs to user
            const fromAcc = await sql`SELECT * FROM accounts WHERE id = ${fromAccount} AND user_id = ${userId} LIMIT 1`;
            if (fromAcc.length === 0) {
                return res.status(404).json({ message: "Source account not found or access denied" });
            }

            // 2. Create schedule
            const schedule = await sql`
                INSERT INTO scheduled_transfers (from_account_id, to_account_id, amount, frequency, next_run_date, status)
                VALUES (${fromAccount}, ${toAccount}, ${amount}, ${frequency}, ${nextRunDate}, 'active')
                RETURNING *
            `;

            return res.status(201).json({
                status: "success",
                message: "Transfer scheduled successfully",
                schedule: schedule[0]
            });
        } catch (error) {
            console.error("Create scheduled transfer error:", error);
            return res.status(500).json({ message: "Failed to schedule transfer" });
        }
    },

    /**
     * getScheduledTransfers - View schedules for user's accounts
     */
    async getScheduledTransfers(req, res) {
        const userId = req.user.id;

        try {
            // Get all user accounts first
            const accounts = await sql`SELECT id FROM accounts WHERE user_id = ${userId}`;
            const accountIds = accounts.map(a => a.id);

            if (accountIds.length === 0) {
                return res.status(200).json({ status: "success", schedules: [] });
            }

            const schedules = await sql`
                SELECT s.*, 
                       af.currency as from_currency, 
                       at.currency as to_currency,
                       ut.name as recipient_name
                FROM scheduled_transfers s
                JOIN accounts af ON s.from_account_id = af.id
                JOIN accounts at ON s.to_account_id = at.id
                JOIN users ut ON at.user_id = ut.id
                WHERE s.from_account_id = ANY(${accountIds})
                ORDER BY s.next_run_date ASC
            `;

            return res.status(200).json({
                status: "success",
                schedules
            });
        } catch (error) {
            console.error("Get scheduled transfers error:", error);
            return res.status(500).json({ message: "Failed to retrieve schedules" });
        }
    },

    /**
     * cancelScheduledTransfer - Cancel a scheduled transfer
     */
    async cancelScheduledTransfer(req, res) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            // Check if the schedule belongs to one of user's accounts
            const result = await sql`
                UPDATE scheduled_transfers s
                SET status = 'cancelled'
                FROM accounts a
                WHERE s.id = ${id} 
                AND s.from_account_id = a.id 
                AND a.user_id = ${userId}
                RETURNING s.id
            `;

            if (result.length === 0) {
                return res.status(404).json({ message: "Schedule not found or access denied" });
            }

            return res.status(200).json({
                status: "success",
                message: "Scheduled transfer cancelled"
            });
        } catch (error) {
            console.error("Cancel scheduled transfer error:", error);
            return res.status(500).json({ message: "Failed to cancel schedule" });
        }
    }
};

module.exports = ScheduledTransferController;
