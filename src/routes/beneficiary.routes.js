const express = require('express');
const router = express.Router();
const BeneficiaryController = require('../controllers/beneficiary.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.authMiddleware);

router.get('/', BeneficiaryController.list);
router.post('/', BeneficiaryController.create);
router.delete('/:id', BeneficiaryController.remove);

module.exports = router;
