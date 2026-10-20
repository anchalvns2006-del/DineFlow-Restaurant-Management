
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Dish name is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Dish description is required"],
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Starters",
        "Soups & Salads",
        "Main Course",
        "Breads",
        "Rice & Biryani",
        "Desserts",
        "Beverages",
      ],
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    imageUrl: {
      type: String,
      required: [true, "Dish image URL is required"],
      trim: true,
      validate: {
        validator: (value) => /^https?:\/\/\S+$/i.test(value),
        message: "Please provide a valid HTTP or HTTPS image URL",
      },
    },

    isVegetarian: {
      type: Boolean,
      required: true,
      default: true,
    },

    allergens: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    preparationTimeMinutes: {
      type: Number,
      min: 1,
      default: 15,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
