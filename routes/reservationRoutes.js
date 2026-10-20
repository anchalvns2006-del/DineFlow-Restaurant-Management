const express = require("express");
const router = express.Router();

const {
  getAvailableTables,
  getReservations,
  createReservation,
  updateReservationStatus,
} = require("../controllers/reservationController");

const { authenticate } = require("../middleware/authMiddleware");

// Require a valid login for all reservation endpoints.
router.use(authenticate);

// Check available tables for a requested time and guest count.
router.get("/availability", getAvailableTables);

// View reservations.
router.get("/", getReservations);

// Create a reservation.
router.post("/", createReservation);

// Update reservation status.
router.patch("/:id/status", updateReservationStatus);

module.exports = router;