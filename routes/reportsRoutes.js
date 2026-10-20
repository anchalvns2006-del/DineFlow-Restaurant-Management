const express = require("express");
const router = express.Router();

const {
  getReportsOverview,
} = require("../controllers/reportsController");

const { authenticate } = require("../middleware/authMiddleware");

// Require a valid login before accessing restaurant analytics.
router.use(authenticate);

// GET /api/reports
router.get("/", getReportsOverview);

module.exports = router;