const express = require("express");
const router = express.Router();
const BeneficiaryController = require("../controllers/beneficiary.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/", BeneficiaryController.addBeneficiary);
router.get("/", BeneficiaryController.getBeneficiaries);
router.delete("/:id", BeneficiaryController.deleteBeneficiary);

module.exports = router;
