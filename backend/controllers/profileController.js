const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────
// Constants (kept in sync with authController)
// ─────────────────────────────────────────────
const MAX_INPUT_LENGTH = 128;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 8;

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

// Always return ONLY safe fields. NEVER the password/hash.
const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email || null,
  emailVerified: Boolean(user.emailVerified),
  pendingEmail: user.pendingEmail || null,
  phone: user.phone || null,
  role: user.role,
});

// ─────────────────────────────────────────────
// GET /api/profile  — current authenticated user's safe profile
// ─────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    // req.user.id is set by the protect middleware from the verified JWT,
    // NOT from any client-supplied id.
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: safeUser(user) });
  } catch (error) {
    console.error("[PROFILE] getProfile error:", error.message);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// ─────────────────────────────────────────────
// PUT /api/profile  — update username / email / phone of own account
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    // Only the authenticated user's own record can be touched.
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // ── Sanitize username ──
    let cleanUsername;
    if (username !== undefined && username !== null) {
      const raw = String(username);
      if (raw.length > MAX_INPUT_LENGTH) {
        return res.status(400).json({ message: "Input exceeds maximum allowed length." });
      }
      cleanUsername = raw.toLowerCase().trim();
      if (cleanUsername.length < MIN_USERNAME_LENGTH) {
        return res.status(400).json({ message: `Username must be at least ${MIN_USERNAME_LENGTH} characters.` });
      }
      if (cleanUsername.length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({ message: `Username cannot exceed ${MAX_USERNAME_LENGTH} characters.` });
      }
    }

    // ── Sanitize phone ──
    let cleanPhone;
    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      const digits = String(phone).replace(/\D/g, "");
      if (digits.length < 10) {
        return res.status(400).json({ message: "Please provide a valid 10-digit phone number." });
      }
      cleanPhone = digits.slice(-10);
    } else {
      cleanPhone = null; // allow clearing phone
    }

    // ── Uniqueness checks (excluding self) ──
    const checks = [];
    if (cleanUsername !== undefined && cleanUsername !== existingUser.username) {
      checks.push(User.findOne({ username: cleanUsername, _id: { $ne: existingUser._id } }));
    }
    if (cleanPhone !== null && cleanPhone !== existingUser.phone) {
      checks.push(User.findOne({ phone: cleanPhone, _id: { $ne: existingUser._id } }));
    }

    if (checks.length > 0) {
      const results = await Promise.all(checks);
      if (results.some(Boolean)) {
        return res.status(409).json({ message: "Username or phone is already registered." });
      }
    }

    // ── Update only intended fields (mass-assignment protection) ──
    // Email is intentionally NOT updated here — it is changed exclusively through
    // the OTP verification flow (see emailVerificationController), so an
    // unverified email can never become a trusted account email.
    const updateFields = {};
    if (cleanUsername !== undefined) updateFields.username = cleanUsername;
    if (phone !== undefined) updateFields.phone = cleanPhone;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const updated = await User.findByIdAndUpdate(
      existingUser._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    console.info(`[PROFILE] Updated profile — user: "${updated.username}"`);
    return res.json({ message: "Profile updated successfully", user: safeUser(updated) });
  } catch (error) {
    console.error("[PROFILE] updateProfile error:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.` });
    }
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// ─────────────────────────────────────────────
// PUT /api/profile/password  — verify current, set new (hashed)
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (String(currentPassword).length > MAX_INPUT_LENGTH || String(newPassword).length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ message: "Input exceeds maximum allowed length." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match." });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Load user WITH password hash to verify current password.
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isCurrentCorrect = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!isCurrentCorrect) {
      console.warn(`[PROFILE] Failed password change attempt — user: "${user.username}" — IP: ${req.ip}`);
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // Hash the new password with the project's bcrypt strength (12 rounds).
    const hashed = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(user._id, { $set: { password: hashed } });

    console.info(`[PROFILE] Password changed — user: "${user.username}"`);
    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("[PROFILE] changePassword error:", error.message);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};
