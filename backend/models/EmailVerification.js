const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "Customer ID is required"], index: true },
    pendingEmail: { type: String, required: [true, "Pending email is required"], lowercase: true, trim: true },
    otpHash: { type: String, required: [true, "OTP hash is required"] },
    expiresAt: { type: Date, required: [true, "Expiration is required"], index: true },
    attemptCount: { type: Number, default: 0, min: 0 },
    lastRequestedAt: { type: Date, default: Date.now },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

emailVerificationSchema.index({ customerId: 1, pendingEmail: 1 });

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);