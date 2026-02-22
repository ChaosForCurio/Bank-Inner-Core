const express = require("express")
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")

const router = express.Router()

router.post("/register", authController.userRegisterController)
router.post("/login", authController.userLoginController)
router.post("/logout", authController.userLogoutController)

router.get("/me", authMiddleware.authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        uuid: req.user.uuid,
        email: req.user.email,
        name: req.user.name,
        is_system: req.user.is_system
    })
})

module.exports = router