const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { sendWhatsAppMessageWithRetry } = require("../utils/whatsappService");

// 👑 Admin gets notifications with pagination
exports.getNotifications = async (req, res) => {
  try {
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

// 👑 Send custom broadcast alerts (Admin only)
exports.sendBroadcast = async (req, res, next) => {
  try {
    const { targetUserId, message } = req.body;

    if (!message || String(message).trim().length === 0) {
      const err = new Error("Message body is required.");
      err.status = 400;
      throw err;
    }

    let targetUsers = [];

    if (targetUserId && targetUserId !== "all") {
      const user = await User.findById(targetUserId);
      if (!user) {
        const err = new Error("Target customer not found.");
        err.status = 404;
        throw err;
      }
      targetUsers = [user];
    } else {
      targetUsers = await User.find({ role: "customer", isActive: true });
    }

    if (targetUsers.length === 0) {
      const err = new Error("No target active customers found to broadcast to.");
      err.status = 400;
      throw err;
    }

    const results = [];
    
    for (const user of targetUsers) {
      // 1. Create in-app notification
      await Notification.create({
        userId: user._id,
        message: message,
        type: "alert",
      });

      // 2. Trigger Twilio WhatsApp alert
      let whatsappSent = false;
      let whatsappError = null;

      if (user.phone) {
        try {
          const waResult = await sendWhatsAppMessageWithRetry(user.phone, message, null, {
            broadcast: true,
            recipient: user.username
          });
          whatsappSent = waResult.success;
          if (!waResult.success) {
            whatsappError = waResult.error;
          }
        } catch (err) {
          whatsappError = err.message;
        }
      } else {
        whatsappError = "No phone number available.";
      }

      results.push({
        userId: user._id,
        username: user.username,
        whatsappSent,
        error: whatsappError
      });
    }

    res.json({
      success: true,
      message: `Broadcast processed for ${targetUsers.length} clients.`,
      results
    });

  } catch (error) {
    next(error);
  }
};