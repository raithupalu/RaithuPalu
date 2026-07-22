const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAX_INPUT_LENGTH = 128; // FIX: Cap inputs before bcrypt to prevent DoS
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

// ─────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────
/**
 * FIX: Token only contains `id` — role and username are fetched
 * fresh from DB in authMiddleware on every request.
 * Prevents stale role bug where old token still carries old role.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const validatePassword = (password) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // ── Input presence checks ──
    if (!password) {
      return res.status(400).json({ message: "Please provide a password." });
    }
    if (!username && !email) {
      return res.status(400).json({ message: "Please provide a username or email." });
    }

    // FIX: Cap input length before any processing to prevent DoS via bcrypt
    if (
      (password && String(password).length > MAX_INPUT_LENGTH) ||
      (username && String(username).length > MAX_INPUT_LENGTH) ||
      (email && String(email).length > MAX_INPUT_LENGTH)
    ) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ── Find user ──
    const query = username
      ? { username: String(username).toLowerCase().trim() }
      : { email: String(email).toLowerCase().trim() };

    const userDoc = await User.findOne(query).select("+password");

    // FIX: Always run bcrypt even if user not found to prevent timing attacks
    // that reveal whether a username/email exists based on response time
    const dummyHash = "$2b$12$invalidhashfortimingprotectiononly.........";
    const passwordToCompare = userDoc?.password || dummyHash;
    const isMatch = await bcrypt.compare(String(password), String(passwordToCompare));

    if (!userDoc || !isMatch) {
      // FIX: Log failed attempts for security monitoring / brute force detection
      console.warn(
        `[AUTH] Failed login attempt — identifier: "${username || email}" — IP: ${req.ip} — ${new Date().toISOString()}`
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // FIX: Check account config integrity
    if (!userDoc.password || typeof userDoc.password !== "string") {
      console.error(`[AUTH] Account config error for user: ${userDoc._id}`);
      return res.status(500).json({ message: "Account configuration error" });
    }

    const user = userDoc.toObject();

    // FIX: Token only carries `id` — no stale role risk
    const token = generateToken(user._id);

    console.info(
      `[AUTH] Successful login — user: "${user.username}" role: "${user.role}" — IP: ${req.ip}`
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email || null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { username, phone, password, email } = req.body;

    // ── Required field checks ──
    if (!username || !password) {
      return res.status(400).json({ message: "Please provide username and password." });
    }
    if (!phone) {
      return res.status(400).json({ message: "Please provide a phone number." });
    }

    // FIX: Cap input length to prevent DoS via bcrypt on huge strings
    if (
      String(username).length > MAX_INPUT_LENGTH ||
      String(password).length > MAX_INPUT_LENGTH
    ) {
      return res.status(400).json({ message: "Input exceeds maximum allowed length." });
    }

    // ── Sanitize username ──
    const cleanUser = String(username).toLowerCase().trim();
    if (cleanUser.length < MIN_USERNAME_LENGTH) {
      return res
        .status(400)
        .json({ message: `Username must be at least ${MIN_USERNAME_LENGTH} characters.` });
    }

    // ── Sanitize phone ──
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length < 10) {
      return res.status(400).json({ message: "Please provide a valid 10-digit phone number." });
    }
    const cleanPhone = digits.slice(-10);

    // ── Validate email if provided ──
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    // ── Password strength ──
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // FIX: Check both username AND phone for duplicates
    // Previously only username was checked — same phone could register twice
    const [existingByUsername, existingByPhone, existingByEmail] = await Promise.all([
      User.findOne({ username: cleanUser }),
      User.findOne({ phone: cleanPhone }),
      cleanEmail ? User.findOne({ email: cleanEmail }) : Promise.resolve(null),
    ]);

    if (existingByUsername) {
      return res.status(409).json({ message: "Username already taken." });
    }
    if (existingByPhone) {
      return res.status(409).json({ message: "Phone number already registered." });
    }
    if (existingByEmail) {
      return res.status(409).json({ message: "Email already registered." });
    }

    // ── Create user ──
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username: cleanUser,
      phone: cleanPhone,
      password: hashedPassword,
      role: "customer",
      ...(cleanEmail && { email: cleanEmail }),
    });

    // FIX: Auto-login after registration — issue token immediately
    // Eliminates extra login round-trip with no security downside
    const token = generateToken(newUser._id);

    console.info(
      `[AUTH] New user registered — username: "${newUser.username}" — IP: ${req.ip}`
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email || null,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error);

    // Handle Mongoose duplicate key error as safety net
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(409).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
      });
    }

    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};