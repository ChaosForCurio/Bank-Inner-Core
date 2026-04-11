const { sql } = require("../db");

const PasskeyModel = {
    /**
     * create - Save a new passkey credential
     */
    async create({ userId, credentialId, publicKey, counter, transports, name }) {
        try {
            const result = await sql`
                INSERT INTO passkeys (user_id, credential_id, public_key, counter, transports, name)
                VALUES (${userId}, ${credentialId}, ${publicKey}, ${counter}, ${transports}, ${name})
                RETURNING *
            `;
            return result[0];
        } catch (error) {
            console.error("Error in PasskeyModel.create:", error);
            throw error;
        }
    },

    /**
     * findByCredentialId - Find a passkey by its credential ID
     */
    async findByCredentialId(credentialId) {
        try {
            const result = await sql`
                SELECT * FROM passkeys 
                WHERE credential_id = ${credentialId} 
                LIMIT 1
            `;
            return result[0] || null;
        } catch (error) {
            console.error("Error in PasskeyModel.findByCredentialId:", error);
            throw error;
        }
    },

    /**
     * listActiveForUser - List all passkeys for a user
     */
    async listActiveForUser(userId) {
        try {
            return await sql`
                SELECT id, credential_id, name, transports, created_at 
                FROM passkeys 
                WHERE user_id = ${userId}
                ORDER BY created_at DESC
            `;
        } catch (error) {
            console.error("Error in PasskeyModel.listActiveForUser:", error);
            throw error;
        }
    },

    /**
     * updateCounter - Update the sign-in counter to prevent cloning
     */
    async updateCounter(credentialId, newCounter) {
        try {
            await sql`
                UPDATE passkeys 
                SET counter = ${newCounter} 
                WHERE credential_id = ${credentialId}
            `;
        } catch (error) {
            console.error("Error in PasskeyModel.updateCounter:", error);
            throw error;
        }
    },

    /**
     * delete - Remove a passkey (revoke)
     */
    async delete(id) {
        try {
            await sql`
                DELETE FROM passkeys 
                WHERE id = ${id}
            `;
        } catch (error) {
            console.error("Error in PasskeyModel.delete:", error);
            throw error;
        }
    }
};

module.exports = PasskeyModel;
