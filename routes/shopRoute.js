const express = require("express");
const router = express.Router();
const {
  createShop,
  updateShop,
  deleteShop,
  getShopsByArea,
  getShopDetailes,
  csvExportShop,
  shiftArea
} = require("../controllers/shopController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");

// Admin-only access for create, update, delete
router.post("/", authenticateUser, checkRole("admin"), createShop);
router.post("/:id", authenticateUser, checkRole("admin"), updateShop);
router.delete("/", authenticateUser, checkRole("admin"), deleteShop);
router.post("/shift/area", authenticateUser, checkRole("admin"), shiftArea);

// Public or protected read
router.post("/route/all", authenticateUser, getShopsByArea);
router.get("/details/:id", authenticateUser, getShopDetailes);

// 4. CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin"), csvExportShop);


module.exports = router;
