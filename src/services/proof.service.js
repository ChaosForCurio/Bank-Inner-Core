const jwt = require("jsonwebtoken");
const ProofModel = require("../models/proof.model");
const AccountModel = require("../models/account.model");
const env = require("../config/env.config");

const PROOF_SECRET = env.PROOF_SECRET || env.JWT_SECRET || "proof-of-wealth-fallback-secret";

const ProofService = {
    /**
     * generate - Verify user wealth and issue a signed token
     */
    async generate({ userId, amount, currency = "INR" }) {
        // 1. Get total balance across all accounts
        const accounts = await AccountModel.findByUserId(userId);
        const totalBalance = accounts
            .filter(acc => acc.currency === currency && acc.status === 'active')
            .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

        if (totalBalance < amount) {
            throw new Error(`Insufficient funds. Your total ${currency} balance is less than ${amount}`);
        }

        // 2. Create database record
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const proofRecord = await ProofModel.create({
            userId,
            amount,
            currency,
            expiresAt
        });

        // 3. Generate signed JWT
        // We include minimal info: just the proof ID and the amount
        const token = jwt.sign(
            {
                p_id: proofRecord.id,
                amt: amount,
                cur: currency,
                iss: "Bank-Inner-Core",
                type: "wealth_proof"
            },
            PROOF_SECRET,
            { expiresIn: "24h" }
        );

        return { token, expiresAt, proofId: proofRecord.id };
    },

    /**
     * verify - Validate a proof token and return its details
     */
    async verify(token) {
        try {
            const decoded = jwt.verify(token, PROOF_SECRET);
            
            if (decoded.type !== "wealth_proof") {
                throw new Error("Invalid token type");
            }

            // Check database to ensure it hasn't been revoked
            const proof = await ProofModel.findById(decoded.p_id);
            
            if (!proof) {
                throw new Error("Proof record not found");
            }

            if (proof.status !== 'active') {
                throw new Error(`Proof is ${proof.status}`);
            }

            if (new Date(proof.expires_at) < new Date()) {
                throw new Error("Proof has expired");
            }

            return {
                valid: true,
                min_balance: parseFloat(proof.amount),
                currency: proof.currency,
                issued_at: proof.created_at,
                expires_at: proof.expires_at
            };
        } catch (error) {
            console.error("Proof verification failed:", error.message);
            return { valid: false, message: error.message };
        }
    }
};

module.exports = ProofService;
