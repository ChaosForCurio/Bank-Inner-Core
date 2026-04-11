const express = require("express");
const authController = require("../controllers/auth.controller");
const passkeyController = require("../controllers/passkey.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/rate-limit.middleware");

const router = express.Router();

// Public routes with rate limiting
router.post("/register", authRateLimiter, authController.userRegisterController);
router.post("/login", authRateLimiter, authController.userLoginController);
router.post("/refresh", authController.refreshTokenController);

// Protected routes
router.post("/logout", authMiddleware, authController.userLogoutController);
router.post("/logout-all", authMiddleware, authController.logoutAllController);

// Passkey management (Protected)
router.get("/passkeys/register/options", authMiddleware, passkeyController.generateRegistrationOptions);
router.post("/passkeys/register/verify", authMiddleware, passkeyController.verifyRegistration);
router.get("/passkeys", authMiddleware, passkeyController.listPasskeys);
router.delete("/passkeys/:id", authMiddleware, passkeyController.deletePasskey);

router.get("/me", authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        uuid: req.user.uuid,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        is_system: req.user.role === 'admin'
    });
});

module.exports = router;