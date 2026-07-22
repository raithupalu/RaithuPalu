const mongoose = require("mongoose");

const buffaloSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Buffalo name is required"],
    minlength: [1, "Name cannot be empty"]
  },
  tagId: { type: String, trim: true },
  breed: { type: String, trim: true },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"]
  },
  status: {
    type: String,
    enum: ['active', 'pregnant', 'dry', 'sold', 'deceased'],
    default: 'active'
  },
  purchaseDate: Date,
  notes: { type: String, trim: true },
  milkCapacity: {
    type: Number,
    min: [0, "Milk capacity cannot be negative"]
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for common queries
buffaloSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Buffalo", buffaloSchema);