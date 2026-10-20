
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Table = require("../models/Table");

const tables = [
  { tableNumber: "T01", name: "Window Table 01", capacity: 2, section: "Indoor" },
  { tableNumber: "T02", name: "Window Table 02", capacity: 2, section: "Indoor" },
  { tableNumber: "T03", name: "Classic Table 03", capacity: 4, section: "Indoor" },
  { tableNumber: "T04", name: "Classic Table 04", capacity: 4, section: "Indoor" },
  { tableNumber: "T05", name: "Family Table 05", capacity: 6, section: "Indoor" },
  { tableNumber: "T06", name: "Family Table 06", capacity: 6, section: "Indoor" },
  { tableNumber: "O01", name: "Garden Table 01", capacity: 4, section: "Outdoor" },
  { tableNumber: "O02", name: "Garden Table 02", capacity: 4, section: "Outdoor" },
  { tableNumber: "PD01", name: "Private Dining Suite", capacity: 8, section: "Private Dining" },
  { tableNumber: "T07", name: "Terrace Table 07", capacity: 4, section: "Terrace" },
  { tableNumber: "V01", name: "VIP Dining Table", capacity: 4, section: "VIP" },
  { tableNumber: "T08", name: "Large Gathering Table", capacity: 10, section: "Indoor" },
];

async function seedTables() {
  try {
    await connectDB();

    const operations = tables.map((table) => ({
      updateOne: {
        filter: { tableNumber: table.tableNumber },
        update: {
          $set: {
            name: table.name,
            capacity: table.capacity,
            section: table.section,
            isActive: true,
          },
          $setOnInsert: {
            status: "Available",
            notes: "",
          },
        },
        upsert: true,
      },
    }));

    const result = await Table.bulkWrite(operations);

    console.log("✅ DineFlow tables seeded successfully!");
    console.log(`🪑 Tables configured: ${tables.length}`);
    console.log(`➕ Inserted: ${result.upsertedCount}`);
    console.log(`🔄 Updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error("❌ Table seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedTables();
