const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const { sendEmail, isEmailConfigured } = require("../utils/emailService");

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 60 seconds
const MAX_ATTEMPTS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Temporary development-only logging to diagnose the OTP send hang.
// Logs ONLY safe status info — never the OTP, passwords, tokens, or credentials.
function otpLog(step) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] ${step}`);
  }
}

// Generate a cryptographically secure random 6-digit OTP.
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

// Invalidate all prior verification records for this customer + email.
async function invalidateExisting(customerId, email) {
  await EmailVerification.updateMany(
    { customerId, pendingEmail: email, consumed: false },
    { $set: { consumed: true } }
  );
}

// ─────────────────────────────────────────────
// POST /api/email/verify/send
// ─────────────────────────────────────────────
exports.sendOtp = async (req, res, next) => {
  try {
    otpLog("request received");
    const email = String(req.body.email || "").toLowerCase().trim();

    if (!email) {
      const err = new Error("Please provide an email address.");
      err.status = 400;
      throw err;
    }
    if (!EMAIL_REGEX.test(email)) {
      const err = new Error("Please provide a valid email address.");
      err.status = 400;
      throw err;
    }

    if (!isEmailConfigured()) {
      const err = new Error("Email service is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in the backend environment.");
      err.status = 500;
      throw err;
    }

    // Only the authenticated customer (req.user.id) can act on their own account.
    otpLog("before customer lookup");
    const customer = await User.findById(req.user.id);
    otpLog("after customer lookup");
    if (!customer) {
      const err = new Error("User not found.");
      err.status = 404;
      throw err;
    }

    // Duplicate email check: must not belong to another customer.
    otpLog("before duplicate email check");
    const existingWithEmail = await User.findOne({
      email,
      _id: { $ne: customer._id },
    });
    otpLog("after duplicate email check");
    if (existingWithEmail) {
      const err = new Error("This email is already associated with another account.");
      err.status = 409;
      throw err;
    }

    // Resend cooldown: only block if there is an ACTIVE (unexpired) OTP already
    // in flight for this email. Expired records must never cause a 429, so a
    // genuinely new/first request is always allowed.
    otpLog("before cooldown check");
    const prior = await EmailVerification.findOne({
      customerId: customer._id,
      pendingEmail: email,
      consumed: false,
      expiresAt: { $gt: new Date() },
    });
    otpLog("after cooldown check");
    if (prior && Date.now() - new Date(prior.lastRequestedAt).getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - new Date(prior.lastRequestedAt).getTime())) / 1000
      );
      const err = new Error(`Please wait ${wait} seconds before requesting another code.`);
      err.status = 429;
      throw err;
    }

    // Generate OTP (hashed) — but do NOT store yet. We persist the record only
    // AFTER the email is successfully sent, so an SMTP failure leaves no orphan
    // OTP record that could block a retry with a false cooldown.
    otpLog("before OTP generation");
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    otpLog("after OTP generation/hash");

    // Send the OTP via the EXISTING email service FIRST.
    otpLog("before email send");
    await sendEmail({
      to: email,
      subject: "RaithuPalu - Email Verification",
      text:
        "RaithuPalu Email Verification\n\n" +
        "Your verification code is:\n\n" +
        otp + "\n\n" +
        "This code expires in 10 minutes.\n\n" +
        "If you did not request this verification, you can ignore this email.\n\n" +
        "RaithuPalu",
    });
    otpLog("after email send");

    // Email sent successfully — now invalidate any prior active OTP and store
    // the new one (single active code).
    otpLog("before invalidate");
    await invalidateExisting(customer._id, email);
    otpLog("after invalidate");

    otpLog("before OTP record create");
    await EmailVerification.create({
      customerId: customer._id,
      pendingEmail: email,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      attemptCount: 0,
      lastRequestedAt: new Date(),
      consumed: false,
    });
    otpLog("after OTP record create");

    // Store pending email on the user (not verified yet).
    otpLog("before pendingEmail update");
    await User.updateOne(
      { _id: customer._id },
      { $set: { pendingEmail: email } }
    );
    otpLog("after pendingEmail update");

    // Never return the OTP.
    otpLog("sending response");
    return res.json({
      success: true,
      message: "Verification code sent.",
      cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
      expiresInSeconds: Math.ceil(OTP_TTL_MS / 1000),
    });
  } catch (error) {
    otpLog(`ERROR after catch: ${error.message}`);
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/email/verify/confirm
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || "").trim();

    if (!otp || !/^\d{6}$/.test(otp)) {
      const err = new Error("Invalid verification code.");
      err.status = 400;
      throw err;
    }

    // Find the customer's most recent active verification record.
    const record = await EmailVerification.findOne({
      customerId: req.user.id,
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!record) {
      const err = new Error("No verification code found. Please request a new code.");
      err.status = 400;
      throw err;
    }

    if (record.consumed) {
      const err = new Error("Verification code already used.");
      err.status = 400;
      throw err;
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await EmailVerification.updateOne({ _id: record._id }, { $set: { consumed: true } });
      const err = new Error("Verification code expired. Please request a new code.");
      err.status = 400;
      throw err;
    }

    if (record.attemptCount >= MAX_ATTEMPTS) {
      await EmailVerification.updateOne({ _id: record._id }, { $set: { consumed: true } });
      const err = new Error("Too many incorrect attempts. Please request a new code.");
      err.status = 429;
      throw err;
    }

    // Compare OTP against the stored hash.
    const matches = await bcrypt.compare(otp, record.otpHash);
    if (!matches) {
      await EmailVerification.updateOne(
        { _id: record._id },
        { $inc: { attemptCount: 1 } }
      );
      const err = new Error("Invalid verification code.");
      err.status = 400;
      throw err;
    }

    // Success: mark email verified, save it, invalidate the OTP (single use).
    const newEmail = record.pendingEmail;
    await User.updateOne(
      { _id: req.user.id },
      { $set: { email: newEmail, emailVerified: true, pendingEmail: null } }
    );
    await EmailVerification.updateOne({ _id: record._id }, { $set: { consumed: true } });

    return res.json({
      success: true,
      message: "Email verified successfully.",
      email: newEmail,
      emailVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/email/verify/resend
// ─────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const customer = await User.findById(req.user.id);
    if (!customer) {
      const err = new Error("User not found.");
      err.status = 404;
      throw err;
    }

    const pendingEmail = String(req.body.email || customer.pendingEmail || "").toLowerCase().trim();
    if (!pendingEmail) {
      const err = new Error("No pending email to resend to. Enter an email first.");
      err.status = 400;
      throw err;
    }
    if (!EMAIL_REGEX.test(pendingEmail)) {
      const err = new Error("Please provide a valid email address.");
      err.status = 400;
      throw err;
    }

    // Resend cooldown — only blocks when an ACTIVE (unexpired) OTP is in flight.
    const prior = await EmailVerification.findOne({
      customerId: customer._id,
      pendingEmail,
      consumed: false,
      expiresAt: { $gt: new Date() },
    });
    if (prior && Date.now() - new Date(prior.lastRequestedAt).getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - new Date(prior.lastRequestedAt).getTime())) / 1000
      );
      const err = new Error(`Please wait ${wait} seconds before resending.`);
      err.status = 429;
      throw err;
    }

    // Generate OTP (hashed). Persist only after the email sends successfully.
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await sendEmail({
      to: pendingEmail,
      subject: "RaithuPalu - Email Verification",
      text:
        "RaithuPalu Email Verification\n\n" +
        "Your verification code is:\n\n" +
        otp + "\n\n" +
        "This code expires in 10 minutes.\n\n" +
        "If you did not request this verification, you can ignore this email.\n\n" +
        "RaithuPalu",
    });

    // Email sent — invalidate old OTP and store the new one.
    await invalidateExisting(customer._id, pendingEmail);

    await EmailVerification.create({
      customerId: customer._id,
      pendingEmail,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      attemptCount: 0,
      lastRequestedAt: new Date(),
      consumed: false,
    });

    await User.updateOne(
      { _id: customer._id },
      { $set: { pendingEmail } }
    );

    return res.json({
      success: true,
      message: "New verification code sent.",
      cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
      expiresInSeconds: Math.ceil(OTP_TTL_MS / 1000),
    });
  } catch (error) {
    next(error);
  }
};
