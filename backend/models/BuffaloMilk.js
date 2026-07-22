const mongoose = require("mongoose");

const buffaloMilkSchema = new mongoose.Schema({
  buffaloId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buffalo",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BuffaloMilk", buffaloMilkSchema);