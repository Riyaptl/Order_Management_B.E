const express = require("express");
const router = express.Router();

const authenticateUser = require("../middlewares/JwtAuth");
const authorizeRoles = require("../middlewares/RoleAuth");

const {
  createOrder,
  getOrdersByArea,
  softDeleteOrder,
  csvExportOrder
} = require("../controllers/orderController");

// 1. Create an order
router.post("/", authenticateUser, createOrder);

// 2. Read Orders by Area (Admin access)
router.post("/all/orders", authenticateUser, authorizeRoles("admin"), getOrdersByArea);

// 3. Soft Delete Order (Admin access)
router.post("/remove/:id", authenticateUser, authorizeRoles("admin"), softDeleteOrder);

// 4. CSV Export
router.post("/csv/export", authenticateUser, authorizeRoles("admin"), csvExportOrder);

module.exports = router;
