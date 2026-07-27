const mongoose = require("mongoose");

const ALLOWED_QUANTITIES = [0.25, 0.5, 0.75, 1, 2, 5];
const ALLOWED_PRICES = [60, 70, 80];

const milkEntrySchema = new mongoose.Schema(
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
      validate: {
        validator: (v) => ALLOWED_QUANTITIES.includes(v),
        message: `Quantity must be one of: ${ALLOWED_QUANTITIES.join(", ")} L`,
      },
    },
    pricePerLitre: {
      type: Number,
      required: [true, "Price per litre is required"],
      enum: {
        values: ALLOWED_PRICES,
        message: `Price per litre must be one of: ${ALLOWED_PRICES.join(", ")}`,
      },
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    session: {
      type: String,
      enum: ["morning", "evening"],
      required: [true, "Session is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    entryType: {
      type: String,
      enum: ["NORMAL", "ORDER"],
      default: "NORMAL",
      index: true,
    },
    notes: String,
  },
  { timestamps: true }
);

milkEntrySchema.index({ userId: 1, date: -1 });

milkEntrySchema.statics.ALLOWED_QUANTITIES = ALLOWED_QUANTITIES;
milkEntrySchema.statics.ALLOWED_PRICES = ALLOWED_PRICES;

module.exports = mongoose.model("MilkEntry", milkEntrySchema);