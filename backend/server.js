const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const isDev = process.env.NODE_ENV !== "production";

// ─────────────────────────────────────────────
// ENV CHECK
// ─────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  if (!isDev) {
    console.error("FATAL: JWT_SECRET required");
    process.exit(1);
  }
  process.env.JWT_SECRET = "dev-secret-1234567890";
}

// ─────────────────────────────────────────────
// UPLOADS DIR
// ─────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─────────────────────────────────────────────
// APP INIT
// ─────────────────────────────────────────────
const app = express();
app.set("trust proxy", 1);

// ─────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use("/temp", express.static(path.join(__dirname, "temp")));

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

// ─────────────────────────────────────────────
// CORS (SELF-HEALING & ROBUST)
// MUST run BEFORE any rate limiters / routes so that even error responses
// (e.g. HTTP 429 from the rate limiter) still carry the correct
// Access-Control-Allow-Origin header. If CORS runs after a middleware that
// short-circuits with an error, the browser sees a missing CORS header and
// reports a misleading "No 'Access-Control-Allow-Origin' header present"
// failure. The `cors()` middleware also automatically answers OPTIONS
// preflight requests for matching routes.
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return cb(null, true);

      const parsedAllowed = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
            .map((o) => o.trim().replace(/\/$/, "").toLowerCase()) // Trim, remove trailing slash, lowercase
        : ["http://localhost:3000", "http://localhost:5000"];

      const cleanOrigin = origin.trim().replace(/\/$/, "").toLowerCase();

      // Automatically allow localhost, capacitor, and Vercel deployments
      const isLocal = cleanOrigin.startsWith("http://localhost") || cleanOrigin.startsWith("capacitor://");
      const isVercel = cleanOrigin.includes("vercel.app");

      if (parsedAllowed.includes(cleanOrigin) || isLocal || isVercel || parsedAllowed.includes("*")) {
        cb(null, true);
      } else {
        console.warn("Blocked by CORS. Clean Origin:", cleanOrigin, "Allowed List:", parsedAllowed);
        cb(null, false); // Deny access safely without throwing server-side errors
      }
    },
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// RATE LIMIT
// OPTIONS preflight requests are skipped so they never consume the budget.
// Browsers send an OPTIONS preflight before every cross-origin request; if
// preflights counted here, a handful of logins would exhaust the /api/auth
// limit and start returning 429 (with the CORS error symptoms described above).
// ─────────────────────────────────────────────
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 100,
    skip: (req) => req.method === "OPTIONS",
    message: { message: "Too many requests" },
  })
);

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 50 : 30,
    skip: (req) => req.method === "OPTIONS",
    message: { message: "Too many login attempts" },
  })
);

// ─────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────
app.use(morgan(isDev ? "dev" : "combined"));

// ─────────────────────────────────────────────
// STATIC BACKGROUND
// ─────────────────────────────────────────────
app.get("/uploads/background.jpg", (req, res) => {
  const file = path.join(uploadsDir, "background.jpg");
  if (!fs.existsSync(file)) {
    return res.status(404).json({ message: "Not found" });
  }
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.sendFile(file);
});

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
const protect = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/milk", require("./routes/milkRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/profile", protect, require("./routes/profileRoutes"));
app.use("/api/notifications", protect, require("./routes/notificationRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/buffalo", protect, authorizeRoles("admin"), require("./routes/buffaloRoutes"));
app.use("/api/expenses", protect, authorizeRoles("admin"), require("./routes/expenseRoutes"));
app.use("/api/users", protect, authorizeRoles("admin"), require("./routes/userRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));

// ─────────────────────────────────────────────
// MULTER (SECURED)
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, "background.jpg"),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});

app.post(
  "/api/background",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  (req, res) => {
    res.json({ imageUrl: "/uploads/background.jpg" });
  }
);

app.get("/api/background", (req, res) => {
  const exists = fs.existsSync(path.join(uploadsDir, "background.jpg"));
  res.json({ imageUrl: exists ? "/uploads/background.jpg" : null });
});

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// ─────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────
app.use(require("./middleware/errorMiddleware"));

// ─────────────────────────────────────────────
// START SERVER (FIXED PORT ISSUE)
// ─────────────────────────────────────────────
connectDB().then(async () => {
  try {
    if (isDev && process.env.SEED_ADMIN_ON_START !== "false") {
      const exists = await User.findOne({ username: "admin" });
      if (!exists) {
        const hash = await bcrypt.hash("admin123", 12);
        await User.create({
          username: "admin",
          password: hash,
          role: "admin",
        });
        console.log("Dev admin created");
      }
    }

    const PORT = process.env.PORT || 5000;

    const startServer = (port) => {
      const server = app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`⚠ Port ${port} busy → trying ${port + 1}`);
          startServer(port + 1);
        } else {
          console.error("Server error:", err);
          process.exit(1);
        }
      });

      return server;
    };

    const server = startServer(PORT);

    // graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Closing server...`);
      server.close(async () => {
        const mongoose = require("mongoose");
        await mongoose.connection.close();
        console.log("MongoDB closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
});
// optional auto billing
require('./utils/autoBilling');
require('./utils/dailyDeliveries');