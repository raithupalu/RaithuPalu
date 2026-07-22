const mongoose = require("mongoose");

const buffaloExpenseSchema = new mongoose.Schema({
  buffaloId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buffalo",
    required: true,
  },
  type: {
    type: String,
    enum: ["feed", "medical", "maintenance", "other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: { type: String, trim: true },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BuffaloExpense", buffaloExpenseSchema);