
const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ingredient name is required."],
      trim: true,
      maxlength: 100,
    },

    sku: {
      type: String,
      required: [true, "A unique SKU is required."],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 40,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Vegetables",
        "Dairy",
        "Meat & Poultry",
        "Seafood",
        "Grains & Rice",
        "Spices & Seasonings",
        "Oils & Sauces",
        "Beverages",
        "Bakery",
        "Other",
      ],
    },

    unit: {
      type: String,
      required: true,
      enum: ["kg", "g", "L", "ml", "pcs", "pack", "bottle"],
    },

    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "Stock must be a finite number.",
      },
    },

    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "Reorder level must be a finite number.",
      },
    },

    costPerUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "Unit cost must be a finite number.",
      },
    },

    supplierName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    storageLocation: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

inventoryItemSchema.index({ category: 1, isActive: 1 });
inventoryItemSchema.index({ currentStock: 1, reorderLevel: 1 });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
