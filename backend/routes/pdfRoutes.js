const express = require("express");
const router = express.Router();

const { downloadMyReport, downloadInvoice } = require("../controllers/pdfController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Customer download PDF
router.get("/my-report", protect, downloadMyReport);

// Admin download invoice PDF
router.get("/invoice/:paymentId", protect, authorizeRoles("admin"), downloadInvoice);

module.exports = router;