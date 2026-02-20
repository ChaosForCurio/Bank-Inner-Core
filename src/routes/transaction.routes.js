const { Router } = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router()

/**
 * - Post /api/transaction/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * Get /api/transaction/history
 * - Get transaction history for user's accounts
 */
transactionRoutes.get("/history", authMiddleware.authMiddleware, transactionController.getTransactionHistory)

/**
 * post /api/transaction/system/intial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/intial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes