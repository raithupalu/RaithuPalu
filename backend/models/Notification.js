const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true, // Allow null for system-wide notifications
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    type: {
      type: String,
      enum: ["order", "payment", "milk", "system", "alert"],
      default: "system",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      sparse: true, // Reference to Order/Payment/etc
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false } // Don't need updatedAt for notifications
);

// Compound index for common queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);