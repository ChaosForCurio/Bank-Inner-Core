const express = require('express');
const router = express.Router();
const VaultController = require('../controllers/vault.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.authMiddleware);

router.post('/', VaultController.createVault);
router.get('/', VaultController.getVaults);
router.post('/contribute', VaultController.contributeToVault);
router.delete('/:id', VaultController.deleteVault);

module.exports = router;
