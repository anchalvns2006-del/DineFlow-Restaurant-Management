
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");
const InventoryItem = require("../models/InventoryItem");
const Recipe = require("../models/Recipe");

// Illustrative demo recipes. Adjust quantities to your restaurant's
// actual standardized recipes before using in real kitchen operations.
const recipeDefinitions = [
  {
    menuName: "Signature Paneer Tikka",
    preparationNotes: "Demo recipe for one serving of paneer tikka.",
    ingredients: [
      { sku: "PAN-001", quantityPerServing: 200 },
      { sku: "VEG-ONI-001", quantityPerServing: 30 },
      { sku: "VEG-BEL-001", quantityPerServing: 30 },
      { sku: "OIL-001", quantityPerServing: 15 },
      { sku: "DAI-YOG-001", quantityPerServing: 40 },
      { sku: "SPC-TAN-001", quantityPerServing: 12 },
    ],
  },
  {
    menuName: "Butter Chicken",
    preparationNotes: "Demo recipe for one serving of butter chicken.",
    ingredients: [
      { sku: "CHK-001", quantityPerServing: 220 },
      { sku: "VEG-TOM-001", quantityPerServing: 100 },
      { sku: "VEG-ONI-001", quantityPerServing: 50 },
      { sku: "OIL-001", quantityPerServing: 15 },
      { sku: "DAI-CRE-001", quantityPerServing: 60 },
      { sku: "DAI-BUT-001", quantityPerServing: 15 },
      { sku: "SPC-CAS-001", quantityPerServing: 10 },
      { sku: "SPC-TAN-001", quantityPerServing: 8 },
    ],
  },
  {
    menuName: "Vegetable Dum Biryani",
    preparationNotes: "Demo recipe using uncooked basmati rice per serving.",
    ingredients: [
      { sku: "RIC-001", quantityPerServing: 180 },
      { sku: "VEG-ONI-001", quantityPerServing: 40 },
      { sku: "VEG-TOM-001", quantityPerServing: 50 },
      { sku: "VEG-BEL-001", quantityPerServing: 50 },
      { sku: "OIL-001", quantityPerServing: 15 },
      { sku: "SPC-TAN-001", quantityPerServing: 5 },
    ],
  },
];

async function seedRecipes() {
  try {
    await connectDB();

    const operations = [];

    for (const definition of recipeDefinitions) {
      const menuItem = await MenuItem.findOne({
        name: definition.menuName,
      }).lean();

      if (!menuItem) {
        throw new Error(
          `Menu item not found: ${definition.menuName}`
        );
      }

      const recipeIngredients = [];

      for (const ingredient of definition.ingredients) {
        const inventoryItem = await InventoryItem.findOne({
          sku: ingredient.sku,
          isActive: true,
        }).lean();

        if (!inventoryItem) {
          throw new Error(
            `Inventory ingredient not found: ${ingredient.sku}`
          );
        }

        recipeIngredients.push({
          inventoryItem: inventoryItem._id,
          quantityPerServing: ingredient.quantityPerServing,
        });
      }

      operations.push({
        updateOne: {
          filter: { menuItem: menuItem._id },
          update: {
            $set: {
              menuItem: menuItem._id,
              ingredients: recipeIngredients,
              servingsPerRecipe: 1,
              preparationNotes: definition.preparationNotes,
              isActive: true,
            },
          },
          upsert: true,
        },
      });
    }

    const result = await Recipe.bulkWrite(operations);

    console.log("✅ DineFlow recipes seeded successfully!");
    console.log(`🍽️ Recipes configured: ${recipeDefinitions.length}`);
    console.log(`➕ Inserted: ${result.upsertedCount}`);
    console.log(`🔄 Updated: ${result.modifiedCount}`);
    console.log("ℹ️ Inventory quantities have not been changed.");
  } catch (error) {
    console.error("❌ Recipe seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedRecipes();
