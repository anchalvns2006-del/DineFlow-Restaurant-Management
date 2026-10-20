
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const InventoryItem = require("../models/InventoryItem");

const ingredients = [
  {
    sku: "PAN-001",
    name: "Fresh Paneer",
    category: "Dairy",
    unit: "g",
    currentStock: 8000,
    reorderLevel: 2000,
    costPerUnit: 0.32,
    supplierName: "Fresh Dairy Supplier",
    storageLocation: "Chiller A",
  },
  {
    sku: "CHK-001",
    name: "Fresh Chicken",
    category: "Meat & Poultry",
    unit: "g",
    currentStock: 12000,
    reorderLevel: 3000,
    costPerUnit: 0.42,
    supplierName: "Fresh Poultry Supplier",
    storageLocation: "Chiller B",
  },
  {
    sku: "RIC-001",
    name: "Basmati Rice",
    category: "Grains & Rice",
    unit: "g",
    currentStock: 20000,
    reorderLevel: 5000,
    costPerUnit: 0.09,
    supplierName: "Grain House",
    storageLocation: "Dry Store A",
  },
  {
    sku: "OIL-001",
    name: "Cooking Oil",
    category: "Oils & Sauces",
    unit: "ml",
    currentStock: 12000,
    reorderLevel: 3000,
    costPerUnit: 0.16,
    supplierName: "Restaurant Supplies Co.",
    storageLocation: "Dry Store B",
  },
  {
    sku: "VEG-ONI-001",
    name: "Onions",
    category: "Vegetables",
    unit: "g",
    currentStock: 10000,
    reorderLevel: 2500,
    costPerUnit: 0.04,
    supplierName: "Fresh Produce Supplier",
    storageLocation: "Vegetable Store",
  },
  {
    sku: "VEG-TOM-001",
    name: "Tomatoes",
    category: "Vegetables",
    unit: "g",
    currentStock: 8000,
    reorderLevel: 2000,
    costPerUnit: 0.06,
    supplierName: "Fresh Produce Supplier",
    storageLocation: "Vegetable Store",
  },
  {
    sku: "VEG-BEL-001",
    name: "Bell Peppers",
    category: "Vegetables",
    unit: "g",
    currentStock: 5000,
    reorderLevel: 1500,
    costPerUnit: 0.12,
    supplierName: "Fresh Produce Supplier",
    storageLocation: "Vegetable Store",
  },
  {
    sku: "DAI-CRE-001",
    name: "Fresh Cream",
    category: "Dairy",
    unit: "ml",
    currentStock: 3000,
    reorderLevel: 750,
    costPerUnit: 0.28,
    supplierName: "Fresh Dairy Supplier",
    storageLocation: "Chiller A",
  },
  {
    sku: "DAI-BUT-001",
    name: "Butter",
    category: "Dairy",
    unit: "g",
    currentStock: 2500,
    reorderLevel: 600,
    costPerUnit: 0.55,
    supplierName: "Fresh Dairy Supplier",
    storageLocation: "Chiller A",
  },
  {
    sku: "SPC-CAS-001",
    name: "Cashews",
    category: "Spices & Seasonings",
    unit: "g",
    currentStock: 1800,
    reorderLevel: 400,
    costPerUnit: 0.9,
    supplierName: "Premium Dry Goods",
    storageLocation: "Dry Store A",
  },
  {
    sku: "SPC-TAN-001",
    name: "Tandoori Spice Mix",
    category: "Spices & Seasonings",
    unit: "g",
    currentStock: 1500,
    reorderLevel: 300,
    costPerUnit: 0.38,
    supplierName: "Premium Spice Supplier",
    storageLocation: "Spice Rack",
  },
  {
    sku: "DAI-YOG-001",
    name: "Plain Yogurt",
    category: "Dairy",
    unit: "g",
    currentStock: 4000,
    reorderLevel: 1000,
    costPerUnit: 0.1,
    supplierName: "Fresh Dairy Supplier",
    storageLocation: "Chiller A",
  },
];

async function seedInventory() {
  try {
    await connectDB();

    const operations = ingredients.map((item) => ({
      updateOne: {
        filter: { sku: item.sku },
        update: {
          $set: {
            name: item.name,
            category: item.category,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            costPerUnit: item.costPerUnit,
            supplierName: item.supplierName,
            storageLocation: item.storageLocation,
            isActive: true,
          },
          // Set stock only when creating a new ingredient.
          // Re-running this script won't refill consumed stock.
          $setOnInsert: {
            currentStock: item.currentStock,
            notes: "",
          },
        },
        upsert: true,
      },
    }));

    const result = await InventoryItem.bulkWrite(operations);

    console.log("✅ DineFlow inventory seeded successfully!");
    console.log(`📦 Ingredients configured: ${ingredients.length}`);
    console.log(`➕ Inserted: ${result.upsertedCount}`);
    console.log(`🔄 Updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error("❌ Inventory seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedInventory();
