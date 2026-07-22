const mongoose = require("mongoose");

const dewormingSchema = new mongoose.Schema({
  buffaloId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buffalo",
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
  },
  date: {
    type: Date,
    required: true,
  },
  notes: { type: String, trim: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Deworming", dewormingSchema);