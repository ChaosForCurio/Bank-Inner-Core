const express = require("express");
const PaymentRequestController = require("../controllers/paymentRequest.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// Public route to fetch request details by token
router.get("/:token", PaymentRequestController.getRequestByToken);

// Authenticated routes
router.use(authMiddleware);
router.post("/", PaymentRequestController.createRequest);
router.post("/:token/fulfill", PaymentRequestController.fulfillRequest);

module.exports = router;
