const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize(['admin']));

router.get("/stats", AdminController.getDashboardStats);
router.get("/users", AdminController.getAllUsers);
router.get("/history", AdminController.getGlobalHistory);
router.patch("/accounts/:accountId/status", AdminController.updateAccountStatus);

module.exports = router;
