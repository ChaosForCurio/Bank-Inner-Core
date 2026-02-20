const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router()

/**
 * - Post /api/transaction/
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)



module.exports = transactionRoutes