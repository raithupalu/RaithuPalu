const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
  buffaloId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buffalo",
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },
  birthDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Child", childSchema);