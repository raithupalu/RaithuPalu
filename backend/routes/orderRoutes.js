const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

// Customer places order
router.post(
  "/",
  protect,
  authorizeRoles("customer"),
  validate([
    body("quantity").isFloat({ gt: 0 }).withMessage("Quantity must be a positive number"),
    body("time").isIn(["morning", "evening"]).withMessage("Delivery time must be 'morning' or 'evening'"),
  ]),
  placeOrder
);

// Customer views own orders
router.get("/my", protect, authorizeRoles("customer"), getMyOrders);

// Admin views all orders
router.get("/", protect, authorizeRoles("admin"), getAllOrders);

// Admin updates order status
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validate([
    param("id").isMongoId().withMessage("Invalid order id"),
    body("status").isIn(["pending", "confirmed", "delivered", "cancelled"]).withMessage("Invalid status"),
  ]),
  updateOrderStatus
);

// Admin deletes order
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validate([param("id").isMongoId().withMessage("Invalid order id")]),
  deleteOrder
);

module.exports = router;