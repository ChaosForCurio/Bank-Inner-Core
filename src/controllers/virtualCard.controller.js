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
            
            // Generate proxy identity if requested
            let proxyEmail = null;
            let proxyPhone = null;
            if (req.body.useProxyIdentity) {
                const proxy = VirtualCardService.generateProxyIdentity();
                proxyEmail = proxy.proxyEmail;
                proxyPhone = proxy.proxyPhone;
            }

            // 3. Persist to DB
            const card = await VirtualCardModel.create({
                userId,
                accountId,
                cardNumber,
                expiryDate,
                cvv,
                nameOnCard,
                type: type || 'disposable',
                proxyEmail,
                proxyPhone
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
    },

    /**
     * weaponizedCancel - Cancels a virtual card and sends a legally binding PDF notice to a merchant
     */
    async weaponizedCancel(req, res) {
        try {
            const { cardId } = req.params;
            const { merchantEmail, merchantName } = req.body;
            const userId = req.user.id;

            if (!merchantEmail || !merchantName) {
                return res.status(400).json({ success: false, message: "Merchant email and name are required to send legal notice" });
            }

            // Verify ownership
            const card = await VirtualCardModel.findById(cardId);
            if (!card || card.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Unauthorized card access" });
            }

            // 1. Permanently cancel the card in the database
            await VirtualCardModel.updateStatus(cardId, 'canceled');

            // 2. Send the automated legal cancellation to the merchant via EmailService
            const EmailService = require("../services/email.service");
            
            // We simulate the legal PDF generation and email sent to the merchant's billing department.
            await EmailService.sendEmail({
                to: merchantEmail,
                subject: `Formal Cancellation Notice: Subscription for Card ending in ${card.card_number.slice(-4)}`,
                text: `
ATTENTION: ${merchantName} Billing Department

This is a formally generated and legally binding notice of cancellation for any subscriptions, recurring charges, or services associated with the Visa ending in ${card.card_number.slice(-4)}.

Effective immediately, the cardholder has revoked all consent for future charges. The virtual card provided has been permanently destroyed on our end. Any future charge attempts will be blocked and may result in automated chargeback filings if persisted.

Please remove this payment method from your records immediately.
                `
            });

            return res.json({ 
                success: true, 
                message: "Weaponized Cancellation complete. Card blocked and legal notice sent to merchant." 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = VirtualCardController;
