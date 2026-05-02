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

/**
 * getPredictiveCashFlow - Forecasts balance for the next 30 days based on historical patterns
 */
async function getPredictiveCashFlow(req, res) {
    try {
        const userId = req.user.id;
        
        // 1. Get current balance
        const accounts = await AccountModel.findByUserId(userId);
        const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
        const accountIds = accounts.map(acc => acc.id);

        if (accountIds.length === 0) {
            return res.json({ status: "success", data: [] });
        }

        // 2. Fetch last 60 days of transactions to identify patterns
        const transactions = await readSql`
            SELECT amount, created_at, description, type
            FROM transactions
            WHERE from_account = ANY(${accountIds})
                OR to_account = ANY(${accountIds})
                AND status = 'completed'
                AND created_at >= NOW() - INTERVAL '60 days'
        `;

        // 3. Simple heuristic: Average daily burn rate
        const outgoings = transactions.filter(t => accountIds.includes(t.from_account));
        const totalOut = outgoings.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const dailyBurn = totalOut / 60;

        // 4. Identify potential recurring payments (simplified)
        // Group by description and check if they occur monthly
        const recurring = [];
        const groups = {};
        outgoings.forEach(t => {
            if (!groups[t.description]) groups[t.description] = [];
            groups[t.description].push(t);
        });

        Object.keys(groups).forEach(desc => {
            if (groups[desc].length >= 2) {
                recurring.push({
                    description: desc,
                    avgAmount: groups[desc].reduce((s, t) => s + parseFloat(t.amount), 0) / groups[desc].length,
                    approxDay: new Date(groups[desc][0].created_at).getDate()
                });
            }
        });

        // 5. Generate 30-day forecast
        const forecast = [];
        let runningBalance = totalBalance;
        const now = new Date();

        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(now.getDate() + i);
            
            // Subtract daily burn
            runningBalance -= dailyBurn;

            // Subtract recurring if it falls on this day
            recurring.forEach(r => {
                if (date.getDate() === r.approxDay) {
                    runningBalance -= r.avgAmount;
                }
            });

            forecast.push({
                date: date.toISOString().split('T')[0],
                predicted_balance: Math.max(0, runningBalance).toFixed(2)
            });
        }

        return res.json({
            status: "success",
            current_balance: totalBalance,
            daily_burn_rate: dailyBurn.toFixed(2),
            forecast
        });
    } catch (error) {
        console.error("Predictive analytics error:", error);
        return res.status(500).json({ message: "Failed to generate cash flow forecast" });
    }
}

module.exports = {
    getSpendingByCategory,
    getBalanceHistory,
    getPredictiveCashFlow
};

