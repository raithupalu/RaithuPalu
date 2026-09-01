const express = require("express");
const router = express.Router();

const { sendTestEmail } = require("../controllers/emailController");
const { sendOtp, verifyOtp, resendOtp } = require("../controllers/emailVerificationController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post("/test-email", protect, authorizeRoles("admin"), sendTestEmail);

router.post("/verify/send", protect, sendOtp);
router.post("/verify/confirm", protect, verifyOtp);
router.post("/verify/resend", protect, resendOtp);

module.exports = router;