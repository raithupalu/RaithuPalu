const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  month: {
    type: String,
    required: [true, "Billing month is required"],
  },
  totalLitres: {
    type: Number,
    required: [true, "Total litres is required"],
    default: 0,
    min: [0, "Total litres cannot be negative"],
  },
  pricePerLitre: {
    type: Number,
    required: [true, "Price per litre is required"],
    default: 50,
    min: [0, "Price per litre cannot be negative"],
  },
  totalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    default: 0,
    min: [0, "Total amount cannot be negative"],
  },
  paid: {
    type: Number,
    required: true,
    default: 0,
    min: [0, "Paid amount cannot be negative"],
  },
  pending: {
    type: Number,
    required: true,
    default: 0,
    min: [0, "Pending amount cannot be negative"],
  },
}, { timestamps: true });

// Indexes for efficient querying
paymentSchema.index({ userId: 1, month: 1 }, { unique: true });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ pending: 1 });

module.exports = mongoose.model("Payment", paymentSchema);