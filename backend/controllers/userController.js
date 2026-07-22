const User = require("../models/User");
const MilkEntry = require("../models/MilkEntry");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Buffalo = require("../models/Buffalo");
const Notification = require("../models/Notification");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");
const { Logger } = require("../utils/logger");

const logger = new Logger("user-controller");

async function deleteCustomerData(userId, session) {
  const deleteOperations = [
    { model: MilkEntry, field: "userId" },
    { model: Payment, field: "userId" },
    { model: Order, field: "userId" },
    { model: Notification, field: "userId" },
    { model: Buffalo, field: "userId" },
    { model: Expense, field: "userId" },
  ];

  for (const operation of deleteOperations) {
    if (!operation.model?.schema?.paths?.[operation.field]) {
      continue;
    }

    await operation.model.deleteMany({ [operation.field]: userId }, { session });
  }
}

async function executeWithSession(operation, session) {
  const query = operation();

  if (session && query && typeof query.session === "function") {
    return query.session(session);
  }

  return query;
}

// ✅ GET ALL CUSTOMERS (ADMIN ONLY)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "customer" }).select("-password");
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// ✅ GET SINGLE USER (SELF OR ADMIN)
exports.getUserById = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;
    const currentUserId = req.user?._id?.toString();

    if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
      const err = new Error("Invalid user ID format");
      err.status = 400;
      throw err;
    }

    // Check authorization: either own profile or admin access
    if (currentUserId !== requestedUserId && req.user?.role !== "admin") {
      const err = new Error("Access denied. You can only view your own profile.");
      err.status = 403;
      throw err;
    }

    const user = await User.findById(requestedUserId).select("-password");

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ✅ DELETE USER (ADMIN ONLY)
exports.deleteUser = async (req, res, next) => {
  const userId = req.params.id;
  const currentUserId = req.user?.id?.toString() || req.user?._id?.toString();

  let session;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error("Invalid user ID format");
      err.status = 400;
      throw err;
    }

    if (currentUserId === userId) {
      const err = new Error("You cannot delete your own account.");
      err.status = 400;
      throw err;
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const existingUser = await executeWithSession(() => User.findById(userId), session);
    if (!existingUser) {
      logger.warn("Delete user rejected because user was not found", { userId });
      await session.abortTransaction();
      await session.endSession();
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    await deleteCustomerData(userId, session);

    const deletedUser = await executeWithSession(() => User.findByIdAndDelete(userId), session);

    if (!deletedUser) {
      logger.warn("Delete user failed after existence check", { userId });
      await session.abortTransaction();
      await session.endSession();
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    await session.commitTransaction();
    await session.endSession();

    logger.info("Customer and all associated records deleted successfully", { userId, deletedBy: currentUserId });
    res.json({ success: true, message: "Customer and all associated records deleted successfully." });
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        logger.error("Failed to abort transaction during customer deletion", abortErr, { userId, deletedBy: currentUserId });
      }
      try {
        await session.endSession();
      } catch (endErr) {
        logger.error("Failed to end session during customer deletion", endErr, { userId, deletedBy: currentUserId });
      }
    }

    logger.error("Unexpected error while deleting customer", err, { userId, deletedBy: currentUserId });
    next(err);
  }
};