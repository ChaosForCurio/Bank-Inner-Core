const express = require("express");
const router = express.Router();
const SwarmController = require("../controllers/swarm.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware.authMiddleware, SwarmController.create);
router.get("/:id", authMiddleware.authMiddleware, SwarmController.getDetails);
router.post("/:swarmId/participants/:participantId/pay", authMiddleware.authMiddleware, SwarmController.fulfillShare);

module.exports = router;
