
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify the bearer token and load the current active user.
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured correctly.",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Load the user from MongoDB so disabled accounts and changed
    // roles take effect without relying on stale token role data.
    const user = await User.findOne({
      _id: decoded.userId,
      isActive: true,
    }).select("_id name email role isActive");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive or no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    next(error);
  }
}

// Restrict a route to specific roles.
// Example: authorizeRoles("admin")
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};
