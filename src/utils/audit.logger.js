const { sql } = require("../db");

/**
 * Sensitive fields that should never be logged
 */
const SENSITIVE_FIELDS = [
    "password", "newPassword", "oldPassword", "hashedPassword",
    "token", "refreshToken", "accessToken",
    "secret", "privateKey", "apiKey"
];

/**
 * scrubSensitiveData - Recursively removes sensitive fields from an object
 */
const scrubSensitiveData = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => scrubSensitiveData(item));
    }

    const scrubbed = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            scrubbed[key] = "[REDACTED]";
        } else if (typeof value === 'object') {
            scrubbed[key] = scrubSensitiveData(value);
        } else {
            scrubbed[key] = value;
        }
    }
    return scrubbed;
};

/**
 * logSecurityEvent - Records a security sensitive event in the audit_logs table
 */
const logSecurityEvent = async ({ userId, action, status, ipAddress, userAgent, metadata }) => {
    try {
        const scrubbedMetadata = metadata ? scrubSensitiveData(metadata) : null;
        
        await sql`
            INSERT INTO audit_logs (user_id, action, status, ip_address, user_agent, metadata)
            VALUES (${userId || null}, ${action}, ${status}, ${ipAddress || null}, ${userAgent || null}, ${scrubbedMetadata})
        `;
    } catch (error) {
        console.error("Failed to log security event:", error);
        // We don't throw here to avoid failing the main request due to logging failure
    }
};

module.exports = {
    logSecurityEvent,
    scrubSensitiveData
};
