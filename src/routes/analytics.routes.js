const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware.authMiddleware);

router.get("/spending", analyticsController.getSpendingByCategory);
router.get("/history", analyticsController.getBalanceHistory);
router.get("/predictive", analyticsController.getPredictiveCashFlow);

module.exports = router;

