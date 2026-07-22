const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

const {
  generateBill,
  getMyPayments,
  getAllPayments,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

// Admin generates bill
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  validate([
    body("userId").isMongoId().withMessage("Invalid userId format"),
    body("month").notEmpty().withMessage("Please provide userId and month"),
  ]),
  generateBill
);

// Admin gets all payments
router.get("/", protect, authorizeRoles("admin"), getAllPayments);

// Customer views payments
router.get("/my", protect, authorizeRoles("customer"), getMyPayments);

// Admin updates payment
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validate([
    param("id").isMongoId().withMessage("Invalid payment id"),
  ]),
  updatePayment
);

// Admin deletes a single payment record
router.delete(
  "/:paymentId",
  protect,
  authorizeRoles("admin"),
  validate([
    param("paymentId").isMongoId().withMessage("Invalid payment id"),
  ]),
  deletePayment
);

module.exports = router;