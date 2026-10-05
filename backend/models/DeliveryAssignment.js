const mongoose = require("mongoose");

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    deliveryManId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    assignedAt: { type: Date, default: Date.now },
    unassignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

deliveryAssignmentSchema.index({ deliveryManId: 1, customerId: 1 }, { unique: true });
deliveryAssignmentSchema.index({ deliveryManId: 1, isActive: 1 });

module.exports = mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);