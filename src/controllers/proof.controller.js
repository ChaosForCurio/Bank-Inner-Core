const ProofService = require("../services/proof.service");

const ProofController = {
    /**
     * generateProof - Request a new wealth proof
     */
    async generateProof(req, res) {
        const { amount, currency } = req.body;
        const userId = req.user.id;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ message: "Valid amount is required" });
        }

        try {
            const result = await ProofService.generate({ userId, amount, currency });
            res.status(201).json({
                status: "success",
                message: "Proof generated successfully. Share this token with the third party.",
                ...result
            });
        } catch (error) {
            console.error("Generate proof error:", error.message);
            res.status(400).json({ message: error.message });
        }
    },

    /**
     * verifyProof - Validate a provided proof token (Public)
     */
    async verifyProof(req, res) {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Token is required for verification" });
        }

        try {
            const result = await ProofService.verify(token);
            if (result.valid) {
                res.json({
                    status: "success",
                    verified: true,
                    data: result
                });
            } else {
                res.status(401).json({
                    status: "failed",
                    verified: false,
                    message: result.message
                });
            }
        } catch (error) {
            res.status(500).json({ message: "Internal verification error" });
        }
    }
};

module.exports = ProofController;
