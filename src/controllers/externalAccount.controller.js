const OpenBankingService = require("../services/openBanking.service");
const ExternalAccountModel = require("../models/externalAccount.model");

const ExternalAccountController = {
    /**
     * @route POST /api/external-accounts/create-link-token
     * @desc Creates a link token to initialize Plaid Link
     */
    async createLinkToken(req, res, next) {
        try {
            const userId = req.user.id;
            const tokenData = await OpenBankingService.createLinkToken(userId);
            
            res.status(200).json({
                success: true,
                message: "Link token created successfully",
                data: tokenData
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * @route POST /api/external-accounts/exchange-token
     * @desc Exchanges public token from frontend for access token
     */
    async exchangeToken(req, res, next) {
        try {
            const userId = req.user.id;
            const { publicToken, institutionName } = req.body;

            if (!publicToken) {
                return res.status(400).json({ success: false, message: "publicToken is required" });
            }

            const account = await OpenBankingService.exchangePublicToken(userId, publicToken, institutionName);

            res.status(201).json({
                success: true,
                message: "External account linked successfully",
                data: account
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * @route GET /api/external-accounts
     * @desc Gets all linked external accounts for the current user
     */
    async getAccounts(req, res, next) {
        try {
            const userId = req.user.id;
            const accounts = await ExternalAccountModel.findByUserId(userId);

            res.status(200).json({
                success: true,
                data: accounts
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * @route GET /api/external-accounts/:accountId/balances
     * @desc Gets real-time balances for a specific linked account
     */
    async getBalances(req, res, next) {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            // First, verify this account belongs to the user
            const accounts = await ExternalAccountModel.findByUserId(userId);
            const account = accounts.find(a => a.id.toString() === accountId);

            if (!account) {
                return res.status(404).json({ success: false, message: "External account not found" });
            }

            const balances = await OpenBankingService.getBalances(accountId);

            res.status(200).json({
                success: true,
                data: {
                    ...account,
                    balances
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * @route DELETE /api/external-accounts/:accountId
     * @desc Unlinks an external account
     */
    async unlinkAccount(req, res, next) {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            const deleted = await ExternalAccountModel.delete(accountId, userId);

            if (!deleted) {
                return res.status(404).json({ success: false, message: "External account not found" });
            }

            res.status(200).json({
                success: true,
                message: "External account unlinked successfully"
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ExternalAccountController;
