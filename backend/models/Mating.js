const mongoose = require("mongoose");

const matingSchema = new mongoose.Schema({
  buffaloId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buffalo",
    required: true,
  },
  matingDate: {
    type: Date,
    required: true,
  },
  expectedDelivery: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "delivered"],
    default: "pending",
  },
  notes: { type: String, trim: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Mating", matingSchema);