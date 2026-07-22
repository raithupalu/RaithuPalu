const Notification = require("../models/Notification");
const Payment = require("../models/Payment");

// 👑 Admin gets notifications with pagination
exports.getNotifications = async (req, res) => {
  try {
    // FIX: Add pagination parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments();

    res.json({
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.json({ message: "Notification marked as read ✅" });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });

    res.json({ message: "All notifications marked as read ✅" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ message: "Error updating notifications" });
  }
};

// Send billing reminders for pending payments
exports.sendBillingReminders = async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ pending: { $gt: 0 } })
      .populate("userId", "username phone");

    const reminders = [];
    for (const payment of pendingPayments) {
      if (payment.userId) {
        // FIX: Use 'payment' type instead of hardcoded 'reminder'
        // Valid types: 'order', 'payment', 'milk', 'system', 'alert'
        const notification = await Notification.create({
          userId: payment.userId._id,
          message: `Payment reminder: ₹${payment.pending.toFixed(2)} pending for ${payment.month}`,
          type: "payment",
          relatedId: payment._id,
        });
        reminders.push(notification);
      }
    }

    res.json({
      message: `${reminders.length} reminders sent`,
      count: reminders.length,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    res.status(500).json({ message: "Error sending reminders" });
  }
};