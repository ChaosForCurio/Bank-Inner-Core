const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const ProofController = require("../controllers/proof.controller");

const proofRoutes = Router();

/**
 * @swagger
 * /api/proof/generate:
 *   post:
 *     summary: Generate a Proof of Wealth token
 *     tags: [Proof of Wealth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Token generated
 */
proofRoutes.post("/generate", authMiddleware.authMiddleware, ProofController.generateProof);

/**
 * @swagger
 * /api/proof/verify:
 *   get:
 *     summary: Public verification of a Proof of Wealth token
 *     tags: [Proof of Wealth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification result
 */
proofRoutes.get("/verify", ProofController.verifyProof);

module.exports = proofRoutes;
