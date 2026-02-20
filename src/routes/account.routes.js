const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const {
    createAccountController,
    getUserAccountsController,
    getUserAccountBalanceController
} = require("../controllers/account.controller")

const router = express.Router()

/**
 * - Post /api/account
 * - Create a new account
 * - Private
 */
router.post("/", authMiddleware.authMiddleware, createAccountController)

/**
 * - Get /api/account
 * - Get all accounts of the logged in user
 * - Private
 */
router.get("/", authMiddleware.authMiddleware, getUserAccountsController)

/**
 * - GET /api/account/balance/:accountId
 * - Get balance for a specific account
 * - Private
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, getUserAccountBalanceController)

module.exports = router