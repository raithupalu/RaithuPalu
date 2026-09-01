const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const { sendEmail, isEmailConfigured } = require("../utils/emailService");

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function invalidateExisting(customerId, email) {
  await EmailVerification.updateMany(
    { customerId, pendingEmail: email, consumed: false },
    { $set: { consumed: true } }
  );
}

exports.sendOtp = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) { const err = new Error("Please provide an email address."); err.status = 400; throw err; }
    if (!EMAIL_REGEX.test(email)) { const err = new Error("Please provide a valid email address."); err.status = 400; throw err; }
    if (!isEmailConfigured()) { const err = new Error("Email service is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in the backend environment."); err.status = 500; throw err; }

    const customer = await User.findById(req.user.id);
    if (!customer) { const err = new Error("User not found."); err.status = 404; throw err; }

    const existingWithEmail = await User.findOne({ email, _id: { $ne: customer._id } });
    if (existingWithEmail) { const err = new Error("This email is already associated with another account."); err.status = 409; throw err; }
const prior = await EmailVerification.findOne({
  customerId: customer._id,
  pendingEmail: email, // (sendOtp) / pendingEmail (resendOtp)
  consumed: false,
  expiresAt: { $gt: new Date() },   // ← ADD THIS
});
    if (prior && Date.now() - new Date(prior.lastRequestedAt).getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(prior.lastRequestedAt).getTime())) / 1000);
      const err = new Error(`Please wait ${wait} seconds before requesting another code.`); err.status = 429; throw err;
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    await invalidateExisting(customer._id, email);
    await EmailVerification.create({
      customerId: customer._id, pendingEmail: email, otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS), attemptCount: 0,
      lastRequestedAt: new Date(), consumed: false,
    });
    await User.updateOne({ _id: customer._id }, { $set: { pendingEmail: email } });

    await sendEmail({
      to: email,
      subject: "RaithuPalu - Email Verification",
      text: "RaithuPalu Email Verification\n\nYour verification code is:\n\n" + otp + "\n\nThis code expires in 10 minutes.\n\nIf you did not request this verification, you can ignore this email.\n\nRaithuPalu",
    });

    return res.json({ success: true, message: "Verification code sent.", cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000), expiresInSeconds: Math.ceil(OTP_TTL_MS / 1000) });
  } catch (error) { next(error); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || "").trim();
    if (!otp || !/^\d{6}$/.test(otp)) { const err = new Error("Invalid verification code."); err.status = 400; throw err; }

    const record = await EmailVerification.findOne({ customerId: req.user.id, consumed: false }).sort({ createdAt: -1 });
    if (!record) { const err = new Error("No verification code found. Please request a new code."); err.status = 400; throw err; }
    if (record.consumed) { const err = new Error("Verification code already used."); err.status = 400; throw err; }
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await EmailVerification.updateOne({ _id: record._id }, { $set: { consumed: true } });
      const err = new Error("Verification code expired. Please request a new code."); err.status = 400; throw err;
    }
    if (record.attemptCount >= MAX_ATTEMPTS) {
      await EmailVerification.updateOne({ _id: record._id }, { $set: { consumed: true } });
      const err = new Error("Too many incorrect attempts. Please request a new code."); err.status = 429; throw err;
    }

    const matches = await bcrypt.compare(otp, record.otpHash);
    if (!matches) {
      await EmailVerification.updateOne({ _id: record._id }, { $inc: { attemptCount: 1 } });
      const err = new Error("Invalid verification code."); err.status = 400; throw err;
    }

    const newEmail = record.pendingEmail;
    await User.updateOne({ _id: req.user.id }, { $set: { email: newEmail, emailVerified: true, pendingEmail: null } });
    await EmailVerification.updateOne({ _id: record._id }, { $set: { consumed: true } });

    return res.json({ success: true, message: "Email verified successfully.", email: newEmail, emailVerified: true });
  } catch (error) { next(error); }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const customer = await User.findById(req.user.id);
    if (!customer) { const err = new Error("User not found."); err.status = 404; throw err; }

    const pendingEmail = String(req.body.email || customer.pendingEmail || "").toLowerCase().trim();
    if (!pendingEmail) { const err = new Error("No pending email to resend to. Enter an email first."); err.status = 400; throw err; }
    if (!EMAIL_REGEX.test(pendingEmail)) { const err = new Error("Please provide a valid email address."); err.status = 400; throw err; }

    const prior = await EmailVerification.findOne({ customerId: customer._id, pendingEmail, consumed: false });
    if (prior && Date.now() - new Date(prior.lastRequestedAt).getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(prior.lastRequestedAt).getTime())) / 1000);
      const err = new Error(`Please wait ${wait} seconds before resending.`); err.status = 429; throw err;
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    await invalidateExisting(customer._id, pendingEmail);
    await EmailVerification.create({
      customerId: customer._id, pendingEmail, otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS), attemptCount: 0,
      lastRequestedAt: new Date(), consumed: false,
    });
    await User.updateOne({ _id: customer._id }, { $set: { pendingEmail } });

    await sendEmail({
      to: pendingEmail,
      subject: "RaithuPalu - Email Verification",
      text: "RaithuPalu Email Verification\n\nYour verification code is:\n\n" + otp + "\n\nThis code expires in 10 minutes.\n\nIf you did not request this verification, you can ignore this email.\n\nRaithuPalu",
    });

    return res.json({ success: true, message: "New verification code sent.", cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000), expiresInSeconds: Math.ceil(OTP_TTL_MS / 1000) });
  } catch (error) { next(error); }
};