const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware")

const transactionRoutes = Router()

/**
 * - Post /api/transaction/
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware)



module.exports = transactionRoutes