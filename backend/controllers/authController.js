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
// LOGIN  (phone + password)
// ─────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { phone, username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a password." });
    }

    const suppliedInputs = [password, phone, username, email].filter(
      (v) => v !== undefined && v !== null && v !== ""
    );
    if (suppliedInputs.some((v) => String(v).length > MAX_INPUT_LENGTH)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Phone is the login identifier (customers + admins), normalized to the
    // same canonical form used at registration/profile. Username/email are
    // kept only as a compatibility fallback.
    let query = null;
    let identifierLabel = "";

    const hasPhone = phone !== undefined && phone !== null && String(phone).trim() !== "";
    const hasUsername = username !== undefined && username !== null && String(username).trim() !== "";
    const hasEmail = email !== undefined && email !== null && String(email).trim() !== "";

    if (hasPhone) {
      const digits = String(phone).replace(/\D/g, "");
      const cleanPhone = digits.length >= 10 ? digits.slice(-10) : String(phone).trim();
      query = { phone: cleanPhone };
      identifierLabel = `phone:${cleanPhone}`;
    } else if (hasUsername) {
      query = { username: String(username).toLowerCase().trim() };
      identifierLabel = `username:${query.username}`;
    } else if (hasEmail) {
      query = { email: String(email).toLowerCase().trim() };
      identifierLabel = `email:${query.email}`;
    }

    if (!query) {
      return res.status(400).json({ message: "Please provide a phone number." });
    }

    const userDoc = await User.findOne(query).select("+password");

    const dummyHash = "$2b$12$invalidhashfortimingprotectiononly.........";
    const passwordToCompare = userDoc?.password || dummyHash;
    const isMatch = await bcrypt.compare(String(password), String(passwordToCompare));

    if (!userDoc || !isMatch) {
      console.warn(
        `[AUTH] Failed login attempt — ${identifierLabel} — IP: ${req.ip} — ${new Date().toISOString()}`
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!userDoc.password || typeof userDoc.password !== "string") {
      console.error(`[AUTH] Account config error for user: ${userDoc._id}`);
      return res.status(500).json({ message: "Account configuration error" });
    }

    const user = userDoc.toObject();
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
        phone: user.phone || null,
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

    if (!username || !password) {
      return res.status(400).json({ message: "Please provide username and password." });
    }
    if (!phone) {
      return res.status(400).json({ message: "Please provide a phone number." });
    }

    if (
      String(username).length > MAX_INPUT_LENGTH ||
      String(password).length > MAX_INPUT_LENGTH
    ) {
      return res.status(400).json({ message: "Input exceeds maximum allowed length." });
    }

    const cleanUser = String(username).toLowerCase().trim();
    if (cleanUser.length < MIN_USERNAME_LENGTH) {
      return res
        .status(400)
        .json({ message: `Username must be at least ${MIN_USERNAME_LENGTH} characters.` });
    }

    const digits = String(phone).replace(/\D/g, "");
    if (digits.length < 10) {
      return res.status(400).json({ message: "Please provide a valid 10-digit phone number." });
    }
    const cleanPhone = digits.slice(-10);

    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

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

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username: cleanUser,
      phone: cleanPhone,
      password: hashedPassword,
      role: "customer",
      ...(cleanEmail && { email: cleanEmail }),
    });

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
        phone: newUser.phone || null,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(409).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
      });
    }

    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};