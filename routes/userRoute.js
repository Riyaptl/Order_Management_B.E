const express = require("express");
const router = express.Router();
const { getAllSRs } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const authorizeRoles = require("../middlewares/RoleAuth");

// Only admin should access this
router.get("/srs", authenticateUser, authorizeRoles("admin"), getAllSRs);

module.exports = router;
