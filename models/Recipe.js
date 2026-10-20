
const mongoose = require("mongoose");

const recipeIngredientSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },

    quantityPerServing: {
      type: Number,
      required: [true, "Ingredient quantity per serving is required."],
      min: [0.000001, "Ingredient quantity must be greater than zero."],
      validate: {
        validator: Number.isFinite,
        message: "Ingredient quantity must be a finite number.",
      },
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      unique: true,
    },

    ingredients: {
      type: [recipeIngredientSchema],
      required: true,
      validate: {
        validator(ingredients) {
          return Array.isArray(ingredients) && ingredients.length > 0;
        },
        message: "A recipe must contain at least one ingredient.",
      },
    },

    servingsPerRecipe: {
      type: Number,
      default: 1,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Servings must be a whole number.",
      },
    },

    preparationNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recipe", recipeSchema);
