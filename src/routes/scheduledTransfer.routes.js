const express = require("express");
const router = express.Router();
const ScheduledTransferController = require("../controllers/scheduledTransfer.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/", ScheduledTransferController.createScheduledTransfer);
router.get("/", ScheduledTransferController.getScheduledTransfers);
router.delete("/:id", ScheduledTransferController.cancelScheduledTransfer);

module.exports = router;
