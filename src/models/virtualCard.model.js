const { sql } = require("../db");

const VirtualCardModel = {
    /**
     * create - Create a new virtual card
     */
    async create({ userId, accountId, cardNumber, expiryDate, cvv, nameOnCard, type = 'disposable' }) {
        try {
            const cards = await sql`
                INSERT INTO virtual_cards (user_id, account_id, card_number, expiry_date, cvv, name_on_card, type)
                VALUES (${userId}, ${accountId}, ${cardNumber}, ${expiryDate}, ${cvv}, ${nameOnCard}, ${type})
                RETURNING *
            `;
            return cards[0];
        } catch (error) {
            console.error("Error in VirtualCardModel.create:", error);
            throw error;
        }
    },

    /**
     * findByUserId - List cards for a user
     */
    async findByUserId(userId) {
        try {
            const cards = await sql`
                SELECT * FROM virtual_cards 
                WHERE user_id = ${userId} AND status != 'deleted'
                ORDER BY created_at DESC
            `;
            return cards;
        } catch (error) {
            console.error("Error in VirtualCardModel.findByUserId:", error);
            throw error;
        }
    },

    /**
     * findByAccountId - List cards for an account
     */
    async findByAccountId(accountId) {
        try {
            const cards = await sql`
                SELECT * FROM virtual_cards 
                WHERE account_id = ${accountId} AND status != 'deleted'
                ORDER BY created_at DESC
            `;
            return cards;
        } catch (error) {
            console.error("Error in VirtualCardModel.findByAccountId:", error);
            throw error;
        }
    },

    /**
     * findById - Get card details
     */
    async findById(id) {
        try {
            const cards = await sql`
                SELECT * FROM virtual_cards WHERE id = ${id} AND status != 'deleted'
            `;
            return cards[0];
        } catch (error) {
            console.error("Error in VirtualCardModel.findById:", error);
            throw error;
        }
    },

    /**
     * updateStatus - Update card status (e.g., deactivate or delete)
     */
    async updateStatus(id, status) {
        try {
            const cards = await sql`
                UPDATE virtual_cards 
                SET status = ${status}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;
            return cards[0];
        } catch (error) {
            console.error("Error in VirtualCardModel.updateStatus:", error);
            throw error;
        }
    }
};

module.exports = VirtualCardModel;
