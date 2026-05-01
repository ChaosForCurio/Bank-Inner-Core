const VirtualCardModel = require("../models/virtualCard.model");
const VirtualCardService = require("../services/virtualCard.service");
const AccountModel = require("../models/account.model");
const { sql } = require("../db");

const VirtualCardController = {
    /**
     * create - Generates a new virtual card
     */
    async create(req, res) {
        try {
            const { accountId, nameOnCard, type } = req.body;
            const userId = req.user.id;

            if (!accountId || !nameOnCard) {
                return res.status(400).json({ success: false, message: "Account ID and Name on Card are required" });
            }

            // 1. Verify account ownership
            const account = await AccountModel.findById(accountId);
            if (!account || account.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Unauthorized account access" });
            }

            // 2. Generate card details
            const cardNumber = VirtualCardService.generateCardNumber();
            const cvv = VirtualCardService.generateCVV();
            const expiryDate = VirtualCardService.generateExpiry();

            // 3. Persist to DB
            const card = await VirtualCardModel.create({
                userId,
                accountId,
                cardNumber,
                expiryDate,
                cvv,
                nameOnCard,
                type: type || 'disposable'
            });

            return res.status(201).json({ 
                success: true, 
                message: "Virtual card generated successfully",
                card 
            });
        } catch (error) {
            console.error("VirtualCard Creation Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * listByAccount - Lists all virtual cards for a specific account
     */
    async listByAccount(req, res) {
        try {
            const { accountId } = req.params;
            const userId = req.user.id;

            // Verify account ownership
            const account = await AccountModel.findById(accountId);
            if (!account || account.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Unauthorized account access" });
            }

            const cards = await VirtualCardModel.findByAccountId(accountId);
            return res.json({ success: true, cards });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * toggleStatus - Enable/Disable a card
     */
    async toggleStatus(req, res) {
        try {
            const { cardId } = req.params;
            const { status } = req.body; // 'active', 'inactive', 'canceled'
            const userId = req.user.id;

            // Verify ownership first
            const card = await VirtualCardModel.findById(cardId);
            if (!card || card.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Unauthorized card access" });
            }

            const updatedCard = await VirtualCardModel.updateStatus(cardId, status);
            return res.json({ success: true, card: updatedCard });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    /**
     * createBurner - Creates a single-use virtual card that auto-cancels after one transaction
     */
    async createBurner(req, res) {
        try {
            const { accountId, nameOnCard, spendingLimit } = req.body;
            const userId = req.user.id;

            if (!accountId || !nameOnCard) {
                return res.status(400).json({ success: false, message: "Account ID and Name on Card are required" });
            }

            const account = await AccountModel.findById(accountId);
            if (!account || account.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Unauthorized account access" });
            }

            const cardNumber = VirtualCardService.generateCardNumber();
            const cvv = VirtualCardService.generateCVV();
            const expiryDate = VirtualCardService.generateExpiry();

            const card = await VirtualCardModel.create({
                userId,
                accountId,
                cardNumber,
                expiryDate,
                cvv,
                nameOnCard,
                type: 'burner'
            });

            // Store spending limit metadata if provided
            if (spendingLimit) {
                await sql`
                    UPDATE virtual_cards 
                    SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{spendingLimit}', ${JSON.stringify(spendingLimit)}::jsonb)
                    WHERE id = ${card.id}
                `;
            }

            return res.status(201).json({
                success: true,
                message: "Single-use burner card created. It will auto-cancel after first transaction.",
                card
            });
        } catch (error) {
            console.error("Burner Card Creation Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * getUserCards - Lists all user's cards (across all accounts)
     */
    async getUserCards(req, res) {
        try {
            const cards = await VirtualCardModel.findByUserId(req.user.id);
            return res.json({ success: true, cards });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = VirtualCardController;
