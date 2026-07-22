const Payment = require("../models/Payment");
const MilkEntry = require("../models/MilkEntry");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function summarizeMilkEntriesForBill(entries) {
  return entries.reduce(
    (acc, entry) => {
      acc.totalLitres += entry.quantity || 0;
      acc.totalAmount += entry.totalPrice || 0;
      acc.pricePerLitreSum += entry.pricePerLitre || 0;
      return acc;
    },
    { totalLitres: 0, totalAmount: 0, pricePerLitreSum: 0 }
  );
}

/** Resolve billing period from strings like "April 2026", "2026-04", or "April" (current year). */
function resolveBillPeriod(monthInput) {
  const raw = String(monthInput || "").trim();
  if (!raw) return null;

  // ISO yyyy-mm
  const iso = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    if (m >= 0 && m <= 11) {
      const d = new Date(y, m, 1);
      return {
        year: y,
        monthIndex: m,
        label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
      };
    }
  }

  let d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return {
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    };
  }

  const named = raw.match(/^(.+?)\s+(\d{4})$/);
  if (named) {
    d = new Date(`${named[1].trim()} 1, ${named[2]}`);
    if (!Number.isNaN(d.getTime())) {
      return {
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
      };
    }
  }

  d = new Date(`${raw} 1, ${new Date().getFullYear()}`);
  if (!Number.isNaN(d.getTime())) {
    return {
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    };
  }

  return null;
}

// Generate monthly bill (admin)
exports.generateBill = async (req, res, next) => {
  try {
    const { userId, month, force } = req.body;

    if (!userId || !month) {
      const err = new Error("Please provide userId and month");
      err.status = 400;
      throw err;
    }

    if (!isValidObjectId(userId)) {
      const err = new Error("Invalid userId format");
      err.status = 400;
      throw err;
    }

    const period = resolveBillPeriod(month);
    if (!period) {
      const err = new Error("Invalid month. Use e.g. April 2026, 2026-04, or April (defaults to current year).");
      err.status = 400;
      throw err;
    }

    const startDate = new Date(period.year, period.monthIndex, 1);
    const endDate = new Date(period.year, period.monthIndex + 1, 0, 23, 59, 59, 999);

    const entries = await MilkEntry.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const { totalLitres, totalAmount: rawTotal, pricePerLitreSum } = summarizeMilkEntriesForBill(entries);
    const avgPricePerLitre =
      entries.length > 0 ? Math.round((pricePerLitreSum / entries.length) * 100) / 100 : 0;
    const totalAmount = Math.round(rawTotal * 100) / 100;

    const existingBill = await Payment.findOne({ userId, month: period.label });
    if (existingBill && !force) {
      return res.status(409).json({ 
        message: "Bill already generated for this month",
        payment: existingBill,
      });
    }

    // If exists and force=true, delete the old bill
    if (existingBill && force) {
      await Payment.deleteOne({ _id: existingBill._id });
    }

    const payment = await Payment.create({
      userId,
      month: period.label,
      totalLitres,
      pricePerLitre: avgPricePerLitre,
      totalAmount,
      paid: 0,
      pending: totalAmount,
    });

    // Create notification for admin
    await Notification.create({
      userId: null, // Admin notification
      message: `New bill generated: ${period.label} - ₹${totalAmount.toFixed(2)}`,
      type: "payment",
      relatedId: payment._id,
    });

    res.json({
      message: "Bill generated",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

// Add partial payment, full settle via markPaid, or legacy { paid: number } increment
exports.updatePayment = async (req, res, next) => {
  try {
    const { paid, markPaid } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }

    if (markPaid === true) {
      payment.paid = payment.totalAmount;
      payment.pending = 0;
      await payment.save();
      return res.json({ message: "Bill marked as paid", payment });
    }

    if (typeof paid !== "number" || paid < 0 || Number.isNaN(paid)) {
      const err = new Error("Please provide a valid paid amount (number) or markPaid: true");
      err.status = 400;
      throw err;
    }

    const newPaid = payment.paid + paid;
    if (newPaid > payment.totalAmount) {
      const err = new Error(`Payment exceeds total bill. Total: ${payment.totalAmount}, Paid: ${payment.paid}, Trying to add: ${paid}`);
      err.status = 400;
      throw err;
    }

    payment.paid = newPaid;
    payment.pending = Math.round((payment.totalAmount - payment.paid) * 100) / 100;
    await payment.save();

    res.json({
      message: "Payment updated",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId || !isValidObjectId(paymentId)) {
      const err = new Error("Invalid payment id");
      err.status = 400;
      throw err;
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const err = new Error("Payment record not found");
      err.status = 404;
      throw err;
    }

    await Payment.deleteOne({ _id: paymentId });

    res.json({
      success: true,
      message: "Payment record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
