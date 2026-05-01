const express = require("express");
const router = express.Router();
const ExchangeController = require("../controllers/exchange.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/rates", ExchangeController.getRates);
router.post("/preview", ExchangeController.preview);
router.post("/execute", authMiddleware.authMiddleware, ExchangeController.execute);

module.exports = router;
