const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

// All notification routes are protected
router.use(protect);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.get("/settings", notificationController.getSettings);
router.put("/settings", notificationController.updateSettings);


module.exports = router;
