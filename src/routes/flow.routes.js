const { Router } = require('express');
const flowRoutes = Router();


/**
 * Post /api/flow/transfer
 * - Create a new transaction
 */

flowRoutes.post("/transfer", authMiddleware.authMiddleware, flowController.createTransaction)


module.exports = flowRoutes;