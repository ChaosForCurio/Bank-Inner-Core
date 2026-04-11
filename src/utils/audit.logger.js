const { sql } = require("../db");

/**
 * logSecurityEvent - Records a security sensitive event in the audit_logs table
 */
const logSecurityEvent = async ({ userId, action, status, ipAddress, userAgent, metadata }) => {
    try {
        await sql`
            INSERT INTO audit_logs (user_id, action, status, ip_address, user_agent, metadata)
            VALUES (${userId || null}, ${action}, ${status}, ${ipAddress || null}, ${userAgent || null}, ${metadata || null})
        `;
    } catch (error) {
        console.error("Failed to log security event:", error);
        // We don't throw here to avoid failing the main request due to logging failure
    }
};

module.exports = {
    logSecurityEvent
};
