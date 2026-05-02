const { sql, readSql } = require("../db");
const AccountModel = require("../models/account.model");

/**
 * getSpendingByCategory - Aggregates spending by category for the authenticated user
 */
async function getSpendingByCategory(req, res) {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        // 1. Get user's accounts
        const accounts = await AccountModel.findByUserId(userId);
        const accountIds = accounts.map(acc => acc.id);

        if (accountIds.length === 0) {
            return res.json({ status: "success", data: [] });
        }

        // 2. Aggregate transactions where this user is the sender
        // We consider 'debits' or transfers FROM the user's account
        const spending = await readSql`
            SELECT 
                category, 
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE from_account = ANY(${accountIds})
                AND status = 'completed'
                AND created_at >= NOW() - INTERVAL '1 day' * ${days}
            GROUP BY category
            ORDER BY total_amount DESC
        `;

        return res.json({
            status: "success",
            data: spending
        });
    } catch (error) {
        console.error("Analytics spending error:", error);
        return res.status(500).json({ message: "Failed to fetch spending analytics" });
    }
}

/**
 * getBalanceHistory - Aggregates balance over time (snapshot per day)
 */
async function getBalanceHistory(req, res) {
    try {
        const userId = req.user.id;
        const { days = 7 } = req.query;

        // 1. Get user's accounts
        const accounts = await AccountModel.findByUserId(userId);
        const accountIds = accounts.map(acc => acc.id);

        if (accountIds.length === 0) {
            return res.json({ status: "success", data: [] });
        }

        // 2. Fetch ledger entries to construct a time-series balance
        // Simplified: take the latest ledger entry per day for each account and sum them
        const history = await readSql`
            WITH daily_balances AS (
                SELECT 
                    DATE(created_at) as date,
                    account_id,
                    LAST_VALUE(balance) OVER (
                        PARTITION BY account_id, DATE(created_at) 
                        ORDER BY created_at 
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    ) as balance
                FROM ledgers
                WHERE account_id = ANY(${accountIds})
                    AND created_at >= NOW() - INTERVAL '1 day' * ${days}
            )
            SELECT 
                date,
                SUM(balance) as total_balance
            FROM daily_balances
            GROUP BY date
            ORDER BY date ASC
        `;

        return res.json({
            status: "success",
            data: history
        });
    } catch (error) {
        console.error("Analytics balance error:", error);
        return res.status(500).json({ message: "Failed to fetch balance history" });
    }
}

module.exports = {
    getSpendingByCategory,
    getBalanceHistory
};
