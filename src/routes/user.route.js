const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const treasuryController = require('../controllers/treasury.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/lookup/:uuid', userController.getUserByUuid);

// Treasury Routes
router.get('/treasury/config', authMiddleware, treasuryController.getConfig);
router.put('/treasury/config', authMiddleware, treasuryController.updateConfig);
router.get('/treasury/logs', authMiddleware, treasuryController.getLogs);

module.exports = router;
