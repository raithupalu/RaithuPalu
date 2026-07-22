const Order = require("../models/Order");
const MilkEntry = require("../models/MilkEntry");
const Notification = require("../models/Notification");

const DEFAULT_PRICE_PER_LITRE = 80;

exports.placeOrder = async (req, res, next) => {
  try {
    const { quantity, time } = req.body;

    if (!quantity || !time) {
      const err = new Error("Please provide quantity and delivery time");
      err.status = 400;
      throw err;
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      const err = new Error("Quantity must be a positive number");
      err.status = 400;
      throw err;
    }

    if (!["morning", "evening"].includes(time)) {
      const err = new Error("Delivery time must be 'morning' or 'evening'");
      err.status = 400;
      throw err;
    }

    const order = await Order.create({
      userId: req.user.id,
      quantity,
      time,
      date: new Date(),
      status: "pending",
    });

    const totalPrice = quantity * DEFAULT_PRICE_PER_LITRE;
    await MilkEntry.create({
      userId: req.user.id,
      quantity,
      pricePerLitre: DEFAULT_PRICE_PER_LITRE,
      totalPrice,
      session: time,
      date: new Date(),
      notes: `Auto-created from order ${order._id}`,
    });

    await Notification.create({
      userId: null,
      message: `New order from ${req.user.username}: ${quantity}L for ${time}`,
      type: "order",
      relatedId: order._id,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ userId: req.user.id });

    res.json({
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate("userId", "username email phone")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    res.json({
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "delivered", "cancelled"].includes(status)) {
      const err = new Error("Invalid status");
      err.status = 400;
      throw err;
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }

    // FIX: Add authorization check
    // Only admin or order owner can update order status
    if (req.user.role !== "admin" && order.userId.toString() !== req.user._id.toString()) {
      const err = new Error("Access denied. You can only update your own orders.");
      err.status = 403;
      throw err;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    res.json({
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }

    // FIX: Add authorization check
    // Only admin or order owner can delete order
    if (req.user.role !== "admin" && order.userId.toString() !== req.user._id.toString()) {
      const err = new Error("Access denied. You can only delete your own orders.");
      err.status = 403;
      throw err;
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
};
