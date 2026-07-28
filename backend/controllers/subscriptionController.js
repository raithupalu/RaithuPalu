const Subscription = require("../models/Subscription");

// ✅ Get logged-in user's subscription
exports.getMySubscription = async (req, res, next) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user.id });

    // If no subscription exists yet, create a default placeholder
    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.user.id,
        quantity: 1,
        timeSlot: "morning",
        frequency: "daily",
        isActive: true,
      });
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

// ✅ Update subscription (Quantity, Time slot, Frequency, or active status)
exports.updateMySubscription = async (req, res, next) => {
  try {
    const { quantity, timeSlot, frequency, isActive } = req.body;

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    updateData.updatedAt = new Date();

    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Toggle Vacation Mode (Pause/Resume Deliveries)
exports.toggleVacationMode = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: "Active status is required" });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      { isActive: Boolean(isActive), updatedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: isActive ? "Deliveries resumed successfully!" : "Vacation mode activated. Deliveries paused.",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

// 👑 Get all customer subscriptions (Admin only)
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const list = await Subscription.find()
      .populate("userId", "username email phone")
      .sort({ updatedAt: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
};
