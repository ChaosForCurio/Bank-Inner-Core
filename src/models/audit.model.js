const { sql } = require("../db");

const AuditModel = {
    /**
     * create - Record an audit log entry
     */
    async create({ userId, action, status, ipAddress, userAgent, metadata }) {
        try {
            const logs = await sql`
                INSERT INTO audit_logs (user_id, action, status, ip_address, user_agent, metadata)
                VALUES (${userId || null}, ${action}, ${status}, ${ipAddress || null}, ${userAgent || null}, ${metadata || null})
                RETURNING *
            `;
            return logs[0];
        } catch (error) {
            console.error("Error in AuditModel.create:", error);
            throw error;
        }
    },

    /**
     * listForUser - Get security history for a user
     */
    async listForUser(userId, limit = 50) {
        try {
            return await sql`
                SELECT * FROM audit_logs 
                WHERE user_id = ${userId} 
                ORDER BY created_at DESC 
                LIMIT ${limit}
            `;
        } catch (error) {
            console.error("Error in AuditModel.listForUser:", error);
            throw error;
        }
    }
};

module.exports = AuditModel;
