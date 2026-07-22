const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// MongoDB Connection Options
// FIX: Added timeouts and pool size — prevents hanging connections under load
// ─────────────────────────────────────────────
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,  // Fail fast if server not found (default: 30s)
  socketTimeoutMS: 45000,          // Close sockets idle longer than 45s
  maxPoolSize: 10,                 // Max concurrent connections (default: 5)
  minPoolSize: 2,                  // Keep at least 2 connections warm
  connectTimeoutMS: 10000,         // Timeout for initial connection attempt
};

// ─────────────────────────────────────────────
// Connection Event Handlers
// FIX: Monitor DB health throughout app lifetime, not just at startup
// ─────────────────────────────────────────────
const registerMongooseEvents = () => {
  mongoose.connection.on("connected", () => {
    console.log(`MongoDB connected ✅ → ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected ⚠️  — Mongoose will auto-retry...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected ✅");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error ❌:", err.message);
  });

  // Handle process-level termination cleanly
  // FIX: Ensures DB closes properly on app shutdown (works alongside server.js graceful shutdown)
  process.on("SIGTERM", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed on SIGTERM.");
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed on SIGINT.");
  });
};

// ─────────────────────────────────────────────
// Connect Function
// ─────────────────────────────────────────────
const connectDB = async () => {
  // FIX: Validate MONGO_URI early with a clear error message
  if (!process.env.MONGO_URI) {
    console.error("FATAL: MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  // Register events only once before connecting
  registerMongooseEvents();

  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    // FIX: 'connected' event above handles the success log with host info
  } catch (error) {
    console.error("MongoDB initial connection failed ❌:", error.message);
    // Exit only on initial startup failure — runtime drops are handled by events
    process.exit(1);
  }
};

module.exports = connectDB;