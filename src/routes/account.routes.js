const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const { createAccountController } = require("../controllers/account.controller")

const router = express.Router()


/**
 * -Post /api/account
 * -Create a new account
 * -Private
 */
router.post("/", authMiddleware.authMiddleware, createAccountController)

/**
 * - Get /api/account/me
 * - Get all accounts of the logged in user
 * - Private
 */
router.get("/", authMiddleware.authMiddleware, getAccountsController)

module.exports = router 