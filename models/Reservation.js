
const mongoose = require("mongoose");
const crypto = require("crypto");

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      unique: true,
      index: true,
      default: () =>
        `RSV-${Date.now().toString(36).toUpperCase()}-${crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase()}`,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: [true, "A table is required for this reservation."],
      index: true,
    },

    guestName: {
      type: String,
      required: [true, "Guest name is required."],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    guestPhone: {
      type: String,
      required: [true, "Guest phone number is required."],
      trim: true,
      maxlength: 20,
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 254,
    },

    guestCount: {
      type: Number,
      required: [true, "Number of guests is required."],
      min: 1,
      max: 30,
      validate: {
        validator: Number.isInteger,
        message: "Guest count must be a whole number.",
      },
    },

    startAt: {
      type: Date,
      required: [true, "Reservation start time is required."],
      index: true,
    },

    endAt: {
      type: Date,
      required: [true, "Reservation end time is required."],
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Seated",
        "Completed",
        "Cancelled",
        "NoShow",
      ],
      default: "Pending",
      index: true,
    },

    occasion: {
      type: String,
      enum: [
        "None",
        "Birthday",
        "Anniversary",
        "Business Dinner",
        "Family Gathering",
        "Other",
      ],
      default: "None",
    },

    specialRequests: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    source: {
      type: String,
      enum: ["Website", "Phone", "Walk-in"],
      default: "Website",
    },
  },
  {
    timestamps: true,
  }
);

reservationSchema.pre("validate", function () {
  if (
    this.startAt &&
    this.endAt &&
    this.endAt <= this.startAt
  ) {
    this.invalidate(
      "endAt",
      "Reservation end time must be later than start time."
    );
  }
});

reservationSchema.index({ table: 1, startAt: 1, endAt: 1 });
reservationSchema.index({ status: 1, startAt: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
