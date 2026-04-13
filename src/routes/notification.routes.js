const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notification.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/", NotificationController.getNotifications);
router.patch("/:id/read", NotificationController.markAsRead);
router.get("/vapid-public-key", NotificationController.getVapidPublicKey);
router.post("/subscribe", NotificationController.subscribe);

module.exports = router;
