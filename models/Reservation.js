const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\d{10}$/, "Phone must be a valid 10-digit number"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      match: [/^\d{2}:\d{2}$/, "Time must be in HH:MM format"],
    },
    people: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
      max: [20, "Maximum 20 guests allowed"],
    },
    tableType: {
      type: String,
      enum: ["indoor", "outdoor", "private"],
      default: "indoor",
      required: false,
    },
    specialRequest: {
      type: String,
      trim: true,
      maxlength: [500, "Special request cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ username: 1 });
reservationSchema.index({ phone: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
