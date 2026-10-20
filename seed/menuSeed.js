require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

const foodImage = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;

const menuItems = [
  {
    name: "Signature Paneer Tikka",
    description:
      "Tandoor-grilled paneer marinated in aromatic Indian spices.",
    category: "Starters",
    price: 349,
    imageUrl: foodImage("photo-1567188040759-fb8a883dc6d8"),
    isVegetarian: true,
    preparationTimeMinutes: 20,
    isFeatured: true,
    tags: ["tandoori", "paneer", "chef special"],
  },
  {
    name: "Crispy Vegetable Spring Rolls",
    description:
      "Golden crispy rolls filled with seasoned vegetables.",
    category: "Starters",
    price: 279,
    imageUrl: foodImage("photo-1601050690597-df0568f70950"),
    isVegetarian: true,
    preparationTimeMinutes: 15,
    tags: ["crispy", "vegetarian"],
  },
  {
    name: "Garden Fresh Salad",
    description:
      "Fresh greens, seasonal vegetables and a light house dressing.",
    category: "Soups & Salads",
    price: 249,
    imageUrl: foodImage("photo-1512621776951-a57141f2eefd"),
    isVegetarian: true,
    preparationTimeMinutes: 10,
    tags: ["fresh", "healthy"],
  },
  {
    name: "Shahi Paneer",
    description:
      "Paneer in a rich, creamy tomato and cashew gravy.",
    category: "Main Course",
    price: 389,
    imageUrl: foodImage("photo-1631452180519-c014fe946bc7"),
    isVegetarian: true,
    preparationTimeMinutes: 25,
    isFeatured: true,
    tags: ["paneer", "creamy", "popular"],
  },
  {
    name: "Dal Makhani",
    description:
      "Slow-cooked black lentils finished with cream and butter.",
    category: "Main Course",
    price: 329,
    imageUrl: foodImage("photo-1585937421612-70a008356fbe"),
    isVegetarian: true,
    preparationTimeMinutes: 25,
    tags: ["lentils", "classic"],
  },
  {
    name: "Butter Chicken",
    description:
      "Tender chicken in a silky tomato-butter gravy.",
    category: "Main Course",
    price: 449,
    imageUrl: foodImage("photo-1603894584373-5ac82b2ae398"),
    isVegetarian: false,
    preparationTimeMinutes: 30,
    isFeatured: true,
    tags: ["chicken", "creamy", "bestseller"],
  },
  {
    name: "Chicken Tikka Masala",
    description:
      "Char-grilled chicken pieces in a spiced masala sauce.",
    category: "Main Course",
    price: 469,
    imageUrl: foodImage("photo-1565557623262-b51c2513a641"),
    isVegetarian: false,
    preparationTimeMinutes: 30,
    tags: ["chicken", "tandoori"],
  },
  {
    name: "Vegetable Dum Biryani",
    description:
      "Fragrant basmati rice layered with vegetables and spices.",
    category: "Rice & Biryani",
    price: 369,
    imageUrl: foodImage("photo-1563379091339-03246963d96c"),
    isVegetarian: true,
    preparationTimeMinutes: 25,
    isFeatured: true,
    tags: ["rice", "biryani"],
  },
  {
    name: "Chicken Dum Biryani",
    description:
      "Aromatic basmati rice cooked with marinated chicken.",
    category: "Rice & Biryani",
    price: 429,
    imageUrl: foodImage("photo-1567337710282-00832b415979"),
    isVegetarian: false,
    preparationTimeMinutes: 30,
    tags: ["chicken", "rice", "biryani"],
  },
  {
    name: "Garlic Butter Naan",
    description:
      "Soft tandoor-baked naan brushed with garlic butter.",
    category: "Breads",
    price: 99,
    imageUrl: foodImage("photo-1601050690597-df0568f70950"),
    isVegetarian: true,
    preparationTimeMinutes: 8,
    tags: ["bread", "garlic"],
  },
  {
    name: "Chocolate Lava Cake",
    description:
      "Warm chocolate cake with a rich molten centre.",
    category: "Desserts",
    price: 249,
    imageUrl: foodImage("photo-1578985545062-69928b1d9587"),
    isVegetarian: true,
    preparationTimeMinutes: 15,
    isFeatured: true,
    tags: ["chocolate", "dessert"],
  },
  {
    name: "Classic Gulab Jamun",
    description:
      "Soft milk-solid dumplings soaked in aromatic sugar syrup.",
    category: "Desserts",
    price: 149,
    imageUrl: foodImage("photo-1551024506-0bccd828d307"),
    isVegetarian: true,
    preparationTimeMinutes: 5,
    tags: ["indian dessert", "sweet"],
  },
  {
    name: "Virgin Mojito",
    description:
      "A refreshing mix of mint, lime and sparkling soda.",
    category: "Beverages",
    price: 199,
    imageUrl: foodImage("photo-1551024709-8f23befc6f87"),
    isVegetarian: true,
    preparationTimeMinutes: 5,
    tags: ["mocktail", "refreshing"],
  },
  {
    name: "Mango Smoothie",
    description:
      "A chilled mango smoothie with a creamy finish.",
    category: "Beverages",
    price: 189,
    imageUrl: foodImage("photo-1544145945-f90425340c7e"),
    isVegetarian: true,
    preparationTimeMinutes: 5,
    tags: ["mango", "smoothie"],
  },
];

async function seedMenu() {
  try {
    await connectDB();

    const operations = menuItems.map((item) => ({
      updateOne: {
        filter: { name: item.name },
        update: { $set: item },
        upsert: true,
      },
    }));

    const result = await MenuItem.bulkWrite(operations);

    console.log("✅ DineFlow menu seeded successfully!");
    console.log(`🍽️ Menu items configured: ${menuItems.length}`);
    console.log(`➕ Inserted: ${result.upsertedCount}`);
    console.log(`🔄 Updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error("❌ Menu seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedMenu();