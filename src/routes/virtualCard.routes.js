const express = require("express");
const router = express.Router();
const VirtualCardController = require("../controllers/virtualCard.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware.authMiddleware, VirtualCardController.create);
router.post("/burner", authMiddleware.authMiddleware, VirtualCardController.createBurner);
router.get("/", authMiddleware.authMiddleware, VirtualCardController.getUserCards);
router.get("/account/:accountId", authMiddleware.authMiddleware, VirtualCardController.listByAccount);
router.patch("/:cardId/status", authMiddleware.authMiddleware, VirtualCardController.toggleStatus);
router.post("/:cardId/weaponized-cancel", authMiddleware.authMiddleware, VirtualCardController.weaponizedCancel);

module.exports = router;
