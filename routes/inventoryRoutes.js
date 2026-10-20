const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStockItems,
  adjustStock,
} = require("../controllers/inventoryController");

const { authenticate } = require("../middleware/authMiddleware");

// Require a valid login for every inventory endpoint.
router.use(authenticate);

// GET /api/inventory/low-stock
router.get("/low-stock", getLowStockItems);

// GET /api/inventory
router.get("/", getInventory);

// PATCH /api/inventory/:id/stock
router.patch("/:id/stock", adjustStock);

module.exports = router;