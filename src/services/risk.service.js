const geoip = require('geoip-lite');
const { sql } = require("../db");

class RiskService {
    /**
     * calculateRiskScore - Calculates a risk score (0-100) for a transaction
     */
    async calculateRiskScore(userId, accountId, amount, ipAddress) {
        let score = 0;

        // 1. Velocity Check (Transactions in the last hour)
        const recentTxs = await sql`
            SELECT count(*) FROM transactions 
            WHERE from_account = ${accountId} 
            AND created_at > NOW() - INTERVAL '1 hour'
        `;
        const txCount = parseInt(recentTxs[0].count);
        if (txCount > 5) score += 30; // High velocity
        else if (txCount > 2) score += 10;

        // 2. Geolocation Check
        if (ipAddress) {
            const geo = geoip.lookup(ipAddress);
            if (geo) {
                // Check against user's last known location (from login history)
                const lastLogin = await sql`
                    SELECT city, country FROM login_history 
                    WHERE user_id = ${userId} 
                    ORDER BY login_time DESC LIMIT 1
                `;
                
                if (lastLogin.length > 0) {
                    if (geo.country !== lastLogin[0].country) {
                        score += 50; // International shift is high risk
                    } else if (geo.city !== lastLogin[0].city) {
                        score += 15; // City shift is moderate risk
                    }
                }
            }
        }

        // 3. Amount Outlier Check
        const avgAmount = await sql`
            SELECT AVG(amount) FROM transactions 
            WHERE from_account = ${accountId} 
            AND status = 'completed'
        `;
        if (avgAmount.length > 0 && avgAmount[0].avg) {
            const average = parseFloat(avgAmount[0].avg);
            if (amount > average * 5) score += 20; // 5x typical spend
        }

        // Cap score at 100
        return Math.min(score, 100);
    }

    /**
     * getRequiredApprovals - Determines how many approvals are needed based on risk
     */
    determineRequiredApprovals(riskScore) {
        if (riskScore >= 80) return 3; // Critical risk: Needs 3 signatures
        if (riskScore >= 50) return 2; // Moderate risk: Needs 2 signatures
        return 1; // Low risk: Standard 1 signature
    }
}

module.exports = new RiskService();
