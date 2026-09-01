const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      lowercase: true,
      index: true, // Add index for faster queries
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow null but enforce uniqueness when present
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.[a-zA-Z]{2,3})+$/, "Please provide valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      sparse: true,
      unique: true, // phone is the customer login identifier — must be unique
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      index: true, // Add index for faster role-based queries
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt
);

// Index for common queries
userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model("User", userSchema);