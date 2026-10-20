const express = require("express");

const router = express.Router();

const {
  getMenu,
  getMenuItemById,
} = require("../controllers/menuController");

router.get("/", getMenu);
router.get("/:id", getMenuItemById);

module.exports = router;