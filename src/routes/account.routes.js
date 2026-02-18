const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")

const router = express.Router()


/**
 * -Post /api/account
 * -Create a new account
 * -Private
 */
router.post("/", authMiddleware.authMiddleware)

module.export = router