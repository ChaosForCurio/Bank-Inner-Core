const { sql } = require("../db");

const ExternalAccountModel = {
    /**
     * Create a new external account connection
     */
    async create({ userId, institutionName, accountId, mask, type, accessToken, itemId }) {
        try {
            const accounts = await sql`
                INSERT INTO external_accounts 
                (user_id, institution_name, account_id, mask, type, access_token, item_id)
                VALUES 
                (${userId}, ${institutionName}, ${accountId}, ${mask}, ${type}, ${accessToken}, ${itemId})
                RETURNING id, user_id, institution_name, account_id, mask, type, created_at
            `;
            // Return without the sensitive access_token
            return accounts[0];
        } catch (error) {
            console.error("Error in ExternalAccountModel.create:", error);
            throw error;
        }
    },

    /**
     * Find all external accounts for a user
     */
    async findByUserId(userId) {
        try {
            const accounts = await sql`
                SELECT id, user_id, institution_name, account_id, mask, type, item_id, created_at 
                FROM external_accounts 
                WHERE user_id = ${userId}
            `;
            return accounts;
        } catch (error) {
            console.error("Error in ExternalAccountModel.findByUserId:", error);
            throw error;
        }
    },
    
    /**
     * Get sensitive account details including access token
     * Used internally by services, NOT returned to client
     */
    async getAccountSecrets(id) {
        try {
            const accounts = await sql`
                SELECT * 
                FROM external_accounts 
                WHERE id = ${id}
            `;
            return accounts[0];
        } catch (error) {
            console.error("Error in ExternalAccountModel.getAccountSecrets:", error);
            throw error;
        }
    },

    /**
     * Delete an external account connection
     */
    async delete(id, userId) {
        try {
            const result = await sql`
                DELETE FROM external_accounts 
                WHERE id = ${id} AND user_id = ${userId}
                RETURNING id
            `;
            return result.length > 0;
        } catch (error) {
            console.error("Error in ExternalAccountModel.delete:", error);
            throw error;
        }
    }
};

module.exports = ExternalAccountModel;
