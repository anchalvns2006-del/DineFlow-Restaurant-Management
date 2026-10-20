const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/menu
// Returns available dishes with optional filters.
exports.getMenu = async (req, res, next) => {
  try {
    const { category, vegetarian, search, featured } = req.query;
    const filter = { isAvailable: true };

    if (category) {
      filter.category = category;
    }

    if (vegetarian === "true" || vegetarian === "false") {
      filter.isVegetarian = vegetarian === "true";
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (search && typeof search === "string") {
      const term = search.trim().slice(0, 80);

      if (term) {
        const safeSearch = escapeRegex(term);

        filter.$or = [
          { name: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
          { tags: { $regex: safeSearch, $options: "i" } },
        ];
      }
    }

    const items = await MenuItem.find(filter)
      .sort({ isFeatured: -1, category: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/menu/:id
// Returns one available dish.
exports.getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID.",
      });
    }

    const item = await MenuItem.findOne({
      _id: id,
      isAvailable: true,
    }).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found or unavailable.",
      });
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};