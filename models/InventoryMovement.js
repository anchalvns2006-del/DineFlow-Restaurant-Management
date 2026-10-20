
const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    movementType: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "ORDER_CONSUMPTION",
        "RESTOCK",
        "MANUAL_ADJUSTMENT",
        "REVERSAL",
      ],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [0.000001, "Movement quantity must be greater than zero."],
      validate: {
        validator: Number.isFinite,
        message: "Movement quantity must be a finite number.",
      },
    },

    unit: {
      type: String,
      enum: ["kg", "g", "L", "ml", "pcs", "pack", "bottle"],
      required: true,
    },

    stockBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    stockAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
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

inventoryMovementSchema.index({ inventoryItem: 1, createdAt: -1 });
inventoryMovementSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model(
  "InventoryMovement",
  inventoryMovementSchema
);
