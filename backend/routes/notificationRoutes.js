const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendBillingReminders,
  sendBroadcast,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Admin gets notifications
router.get("/", protect, authorizeRoles("admin"), getNotifications);

// Mark notification as read
router.put("/:id", protect, authorizeRoles("admin"), markAsRead);

// Mark all notifications as read
router.put("/", protect, authorizeRoles("admin"), markAllAsRead);

// Send billing reminders
router.post("/remind", protect, authorizeRoles("admin"), sendBillingReminders);

// Admin sends custom broadcast alerts (WhatsApp + In-App)
router.post("/broadcast", protect, authorizeRoles("admin"), sendBroadcast);

module.exports = router;