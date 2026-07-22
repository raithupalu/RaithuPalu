const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.5, "Minimum order is 0.5 liters"],
      max: [100, "Maximum order is 100 liters"],
    },
    time: {
      type: String,
      enum: ["morning", "evening"],
      required: [true, "Delivery time is required"],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    deliveryDate: {
      type: Date,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Compound index for admin queries
orderSchema.index({ userId: 1, date: -1 });
orderSchema.index({ status: 1, date: -1 });

module.exports = mongoose.model("Order", orderSchema);