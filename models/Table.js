
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, "Table number is required."],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    capacity: {
      type: Number,
      required: [true, "Table seating capacity is required."],
      min: 1,
      max: 30,
      validate: {
        validator: Number.isInteger,
        message: "Table capacity must be a whole number.",
      },
    },

    section: {
      type: String,
      enum: ["Indoor", "Outdoor", "Private Dining", "Terrace", "VIP"],
      default: "Indoor",
    },

    status: {
      type: String,
      enum: ["Available", "Occupied", "Reserved", "Maintenance"],
      default: "Available",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.index({ section: 1, status: 1 });

module.exports = mongoose.model("Table", tableSchema);
