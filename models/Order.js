
const mongoose = require("mongoose");
const crypto = require("crypto");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number.",
      },
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      default: () =>
        `DF-${Date.now().toString(36).toUpperCase()}-${crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase()}`,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    customerPhone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    orderType: {
      type: String,
      enum: ["Dine-in", "Takeaway", "Delivery"],
      required: true,
      default: "Dine-in",
    },

    tableNumber: {
      type: String,
      trim: true,
      default: "",
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one dish.",
      },
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Served",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    inventoryDeductedAt: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Online"],
      default: "Cash",
    },

    specialInstructions: {
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

// Calculate bill amounts on the server before validation.
orderSchema.pre("validate", function () {
  this.items.forEach((item) => {
    item.lineTotal = Number(
      (item.quantity * item.unitPrice).toFixed(2)
    );
  });

  this.subtotal = Number(
    this.items
      .reduce((sum, item) => sum + item.lineTotal, 0)
      .toFixed(2)
  );

  this.taxAmount = Number(
    ((this.subtotal * this.taxRate) / 100).toFixed(2)
  );

  this.totalAmount = Number(
    (
      this.subtotal +
      this.taxAmount -
      this.discountAmount
    ).toFixed(2)
  );
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
