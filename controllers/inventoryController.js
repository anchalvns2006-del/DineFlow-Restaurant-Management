
const mongoose = require("mongoose");
const InventoryItem = require("../models/InventoryItem");

// GET /api/inventory
// View inventory with optional category, search and low-stock filters.
exports.getInventory = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    const { category, search, lowStock } = req.query;

    if (category) {
      filter.category = category;
    }

    if (search && typeof search === "string") {
      const term = search.trim().slice(0, 80);

      if (term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.name = { $regex: escaped, $options: "i" };
      }
    }

    if (lowStock === "true") {
      filter.$expr = { $lte: ["$currentStock", "$reorderLevel"] };
    }

    const items = await InventoryItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();

    const enrichedItems = items.map((item) => ({
      ...item,
      stockValue: Number(
        (item.currentStock * item.costPerUnit).toFixed(2)
      ),
      isLowStock: item.currentStock <= item.reorderLevel,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedItems.length,
      items: enrichedItems,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/low-stock
// View ingredients at or below their reorder level.
exports.getLowStockItems = async (req, res, next) => {
  try {
    const items = await InventoryItem.find({
      isActive: true,
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
    })
      .sort({ currentStock: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/inventory/:id/stock
// Receive or consume a positive quantity.
exports.adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, quantity } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID.",
      });
    }

    if (!["receive", "consume"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'receive' or 'consume'.",
      });
    }

    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 100000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number.",
      });
    }

    const delta = action === "receive" ? quantity : -quantity;

    // For consumption, the stock condition is checked atomically
    // as part of the update, preventing the quantity going negative.
    const filter = {
      _id: id,
      isActive: true,
      ...(action === "consume"
        ? { currentStock: { $gte: quantity } }
        : {}),
    };

    const item = await InventoryItem.findOneAndUpdate(
      filter,
      { $inc: { currentStock: delta } },
      { new: true, runValidators: true }
    );

    if (!item) {
      const exists = await InventoryItem.exists({
        _id: id,
        isActive: true,
      });

      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Insufficient stock for this operation.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        action === "receive"
          ? "Stock received successfully."
          : "Stock consumed successfully.",
      item: {
        _id: item._id,
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        isLowStock: item.currentStock <= item.reorderLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};
