const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Expense title is required"],
    trim: true,
    minlength: [1, "Title cannot be empty"],
  },
  amount: {
    type: Number,
    required: [true, "Expense amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for efficient date-range queries
expenseSchema.index({ date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);