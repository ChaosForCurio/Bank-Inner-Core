const express = require("express");
const router = express.Router();
const ExternalAccountController = require("../controllers/externalAccount.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

// All external account routes require authentication
router.use(authMiddleware);

// Initialize Link
router.post("/create-link-token", ExternalAccountController.createLinkToken);

// Complete Link
router.post("/exchange-token", ExternalAccountController.exchangeToken);

// Manage Accounts
router.get("/", ExternalAccountController.getAccounts);
router.delete("/:accountId", ExternalAccountController.unlinkAccount);

// Fetch Data
router.get("/:accountId/balances", ExternalAccountController.getBalances);

module.exports = router;
