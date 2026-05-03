const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const InheritanceController = require("../controllers/inheritance.controller");

const inheritanceRoutes = Router();

inheritanceRoutes.use(authMiddleware.authMiddleware);

inheritanceRoutes.get("/", InheritanceController.getConfig);
inheritanceRoutes.post("/configure", InheritanceController.configure);
inheritanceRoutes.post("/cancel", InheritanceController.cancel);

module.exports = inheritanceRoutes;
