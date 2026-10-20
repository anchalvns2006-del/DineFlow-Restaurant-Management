const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require("../controllers/OrderController");

const { authenticate } = require("../middleware/authMiddleware");

// Require a valid login for every order endpoint.
router.use(authenticate);

// Create a restaurant order.
router.post("/", createOrder);

// List orders.
router.get("/", getOrders);

// Update kitchen/order status.
router.patch("/:id/status", updateOrderStatus);

module.exports = router;