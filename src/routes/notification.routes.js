const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

// All notification routes are protected
router.use(protect);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/:id/acknowledge", notificationController.acknowledgeDelivery);
router.post("/:id/action", notificationController.handleAction);
router.get("/settings", notificationController.getSettings);
router.put("/settings", notificationController.updateSettings);


<<<<<<< HEAD
router.get("/", NotificationController.getNotifications);
router.patch("/:id/read", NotificationController.markAsRead);
router.get("/vapid-public-key", NotificationController.getVapidPublicKey);
router.post("/subscribe", NotificationController.subscribe);
router.post("/", NotificationController.sendNotification);
=======
>>>>>>> e4f8b24e3e2299031686f4ca80c2b0442b8400a1

module.exports = router;
