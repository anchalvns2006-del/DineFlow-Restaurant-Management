
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  login,
  getMe,
  createStaff,
} = require("../controllers/authController");

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Limit repeated login attempts from the same client.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// POST /api/auth/login
router.post("/login", loginLimiter, login);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

// POST /api/auth/staff
// Only an authenticated administrator can create staff accounts.
router.post(
  "/staff",
  authenticate,
  authorizeRoles("admin"),
  createStaff
);

module.exports = router;
