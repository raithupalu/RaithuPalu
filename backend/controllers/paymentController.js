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

/** Period key for chronological comparison: "2026-08" sorts correctly. */
function periodKey(period) {
  return period
    ? `${period.year}-${String(period.monthIndex + 1).padStart(2, "0")}`
    : "";
}

/**
 * Compute the customer's outstanding balance from ALL PRIOR bills (billing
 * periods strictly earlier than `targetPeriod`). Only unpaid amounts from
 * previous billing periods carry forward — counted once, never duplicated.
 */
async function getPreviousOutstanding(userId, targetPeriod) {
  const payments = await Payment.find({ userId }).lean();

  let outstanding = 0;
  for (const p of payments) {
    const pPeriod = resolveBillPeriod(p.month);
    if (!pPeriod) continue;
    if (periodKey(pPeriod) < periodKey(targetPeriod)) {
      outstanding += Number(p.pending || 0);
    }
  }
  return Math.round(outstanding * 100) / 100;
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

    const { totalLitres, totalAmount: rawMilkCharges, pricePerLitreSum } = summarizeMilkEntriesForBill(entries);
    const avgPricePerLitre =
      entries.length > 0 ? Math.round((pricePerLitreSum / entries.length) * 100) / 100 : 0;
    const milkCharges = Math.round(rawMilkCharges * 100) / 100;

    const existingBill = await Payment.findOne({ userId, month: period.label });
    if (existingBill && !force) {
      return res.status(409).json({
        message: "Bill already generated for this month",
        payment: existingBill,
      });
    }

    // If exists and force=true, delete the old bill.
    if (existingBill && force) {
      await Payment.deleteOne({ _id: existingBill._id });
    }

    // Previous outstanding from bills BEFORE this period (database source of truth).
    const previousBalance = await getPreviousOutstanding(userId, period);

    // Final payable = current milk charges + previous outstanding.
    const totalAmount = Math.round((milkCharges + previousBalance) * 100) / 100;

    const payment = await Payment.create({
      userId,
      month: period.label,
      totalLitres,
      pricePerLitre: avgPricePerLitre,
      milkCharges,
      previousBalance,
      totalAmount,
      paid: 0,
      pending: totalAmount,
      payments: [],
    });

    await Notification.create({
      userId: null,
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

// Add partial payment, full settle via markPaid, or legacy { paid: number } increment.
// Every payment is validated against the DB's current pending and appended to the
// payment history array. Multiple payments accumulate (never overwrite history).
exports.updatePayment = async (req, res, next) => {
  try {
    const { paid, markPaid, note } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }

    let amount = 0;

    if (markPaid === true) {
      amount = Number(payment.pending || 0);
    } else if (typeof paid === "number" && !Number.isNaN(paid)) {
      if (paid <= 0) {
        const err = new Error("Payment amount must be greater than 0");
        err.status = 400;
        throw err;
      }
      amount = Math.round(paid * 100) / 100;
    } else {
      const err = new Error("Please provide a valid paid amount (number) or markPaid: true");
      err.status = 400;
      throw err;
    }

    // Backend is the source of truth: never allow overpayment against pending.
    const remaining = Number(payment.pending || 0);
    if (amount > remaining + 0.001) {
      const err = new Error(
        `Payment exceeds current pending amount. Pending: ${remaining.toFixed(2)}, Payment: ${amount.toFixed(2)}`
      );
      err.status = 400;
      throw err;
    }

    const newPaid = Math.round((payment.paid + amount) * 100) / 100;
    const newPending = Math.round((payment.totalAmount - newPaid) * 100) / 100;

    payment.paid = newPaid;
    payment.pending = newPending < 0 ? 0 : newPending;

    // Append to history (preserve all prior payments).
    payment.payments.push({
      amount,
      date: new Date(),
      note: note || "",
    });

    await payment.save();

    res.json({
      message: newPending <= 0.001 ? "Bill fully paid" : "Payment recorded",
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