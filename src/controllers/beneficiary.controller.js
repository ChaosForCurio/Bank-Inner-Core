const { sql } = require("../db");

const BeneficiaryController = {
    /**
     * addBeneficiary - Add a beneficiary for the logged in user
     */
    async addBeneficiary(req, res) {
        const { beneficiaryAccountId, nickname } = req.body;
        const userId = req.user.id;

        if (!beneficiaryAccountId || !nickname) {
            return res.status(400).json({ message: "beneficiaryAccountId and nickname are required" });
        }

        try {
            // 1. Verify that the beneficiary account exists
            const account = await sql`SELECT * FROM accounts WHERE id = ${beneficiaryAccountId} LIMIT 1`;
            if (account.length === 0) {
                return res.status(404).json({ message: "Beneficiary account not found" });
            }

            // 2. Check if already added
            const existing = await sql`
                SELECT * FROM beneficiaries 
                WHERE user_id = ${userId} AND beneficiary_account_id = ${beneficiaryAccountId} 
                LIMIT 1
            `;
            if (existing.length > 0) {
                return res.status(400).json({ message: "This beneficiary is already in your list" });
            }

            // 3. Add beneficiary
            const beneficiary = await sql`
                INSERT INTO beneficiaries (user_id, beneficiary_account_id, nickname)
                VALUES (${userId}, ${beneficiaryAccountId}, ${nickname})
                RETURNING *
            `;

            return res.status(201).json({
                status: "success",
                message: "Beneficiary added successfully",
                beneficiary: beneficiary[0]
            });
        } catch (error) {
            console.error("Add beneficiary error:", error);
            return res.status(500).json({ message: "Failed to add beneficiary" });
        }
    },

    /**
     * getBeneficiaries - Get all beneficiaries for the logged in user
     */
    async getBeneficiaries(req, res) {
        const userId = req.user.id;

        try {
            const beneficiaries = await sql`
                SELECT b.*, u.name as user_name, u.email as user_email, a.currency
                FROM beneficiaries b
                JOIN accounts a ON b.beneficiary_account_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE b.user_id = ${userId}
                ORDER BY b.nickname ASC
            `;

            return res.status(200).json({
                status: "success",
                beneficiaries
            });
        } catch (error) {
            console.error("Get beneficiaries error:", error);
            return res.status(500).json({ message: "Failed to retrieve beneficiaries" });
        }
    },

    /**
     * deleteBeneficiary - Remove a beneficiary
     */
    async deleteBeneficiary(req, res) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            const result = await sql`
                DELETE FROM beneficiaries 
                WHERE id = ${id} AND user_id = ${userId}
                RETURNING id
            `;

            if (result.length === 0) {
                return res.status(404).json({ message: "Beneficiary not found or access denied" });
            }

            return res.status(200).json({
                status: "success",
                message: "Beneficiary removed"
            });
        } catch (error) {
            console.error("Delete beneficiary error:", error);
            return res.status(500).json({ message: "Failed to remove beneficiary" });
        }
    }
};

module.exports = BeneficiaryController;
