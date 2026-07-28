const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // A customer has one active subscription plan
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.1, "Quantity must be at least 0.1 liters"],
      default: 1,
    },
    timeSlot: {
      type: String,
      enum: ["morning", "evening"],
      default: "morning",
    },
    frequency: {
      type: String,
      enum: ["daily", "alternate", "weekly"],
      default: "daily",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Fast querying for midnight delivery logging
    },
    notes: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);