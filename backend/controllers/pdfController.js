const MilkEntry = require("../models/MilkEntry");
const User = require("../models/User");
const Payment = require("../models/Payment");
const path = require("path");
const {
  generateInvoicePDF,
  generateInvoiceFilename,
  TEMP_DIR,
} = require("../utils/pdfGenerator");

// =============================
// Helpers
// =============================
function parseBillingMonth(monthStr) {
  if (!monthStr) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const yearMatch = monthStr.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

  let month;

  if (monthStr.includes("-")) {
    const [, m] = monthStr.split("-");
    month = parseInt(m) - 1;
  } else {
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    month = monthNames.findIndex((m) =>
      monthStr.toLowerCase().includes(m.toLowerCase())
    );

    if (month === -1) month = new Date().getMonth();
  }

  return { year, month };
}

function getMonthDateRange(year, month) {
  const startDate = new Date(year, month, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(year, month + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

// =============================
// 🧾 ADMIN INVOICE
// =============================
exports.downloadInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.info(`Invoice download requested: paymentId=${paymentId} by user=${req.user?.id}`);

    const payment = await Payment.findById(paymentId)
      .populate("userId", "username phone email");

    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }

    // authorize: admin or owner of the payment
    if (req.user.role !== 'admin' && String(req.user.id) !== String(payment.userId._id)) {
      const err = new Error('Access denied');
      err.status = 403;
      throw err;
    }

    const { year, month } = parseBillingMonth(payment.month);
    const { startDate, endDate } = getMonthDateRange(year, month);

    const entries = await MilkEntry.find({
      userId: payment.userId._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 }).lean();

    console.info(`Invoice for ${paymentId}: entries=${entries.length} start=${startDate.toISOString()} end=${endDate.toISOString()}`);

    // ✅ CORRECT BILLING
    const totalLitres = entries.reduce(
      (sum, e) => sum + (e.quantity || 0),
      0
    );

    // Current-month milk charges come from the entries.
    const milkCharges = Number(
      entries.reduce((sum, e) => sum + (e.totalPrice || 0), 0).toFixed(2)
    );

    const avgPrice =
      totalLitres > 0 ? (milkCharges / totalLitres).toFixed(2) : 0;

    // Previous outstanding + final payable from the persisted bill (DB is source of truth).
    const previousBalance = Number(payment.previousBalance || 0);
    const totalAmount = Number(payment.totalAmount ?? (milkCharges + previousBalance));
    const paid = Number(payment.paid || 0);
    const pending = Number(payment.pending ?? Math.max(0, totalAmount - paid));

    // Generate a temporary file and send it as a download. This keeps the PDF generator simple
    const filename = generateInvoiceFilename(payment.userId._id.toString(), payment.month || 'invoice');
    const filePath = path.join(TEMP_DIR, filename);

    await generateInvoicePDF(filePath, {
      customerName: payment.userId.username,
      customerPhone: payment.userId.phone || "",
      customerEmail: payment.userId.email || "",
      billingMonth: payment.month || '',
      billingPeriodStart: startDate.toISOString().split('T')[0],
      billingPeriodEnd: endDate.toISOString().split('T')[0],
      totalLitres: Number(totalLitres.toFixed(2)),
      pricePerLitre: avgPrice,
      milkCharges: Number(milkCharges.toFixed(2)),
      previousBalance,
      totalAmount: Number(totalAmount.toFixed(2)),
      paid,
      pending,
      entries,
      invoiceNumber: payment._id.toString(),
      issueDate: new Date().toLocaleDateString('en-IN'),
    });

    // Stream file as download
    res.download(filePath, filename, (err) => {
      if (err) {
        next(err);
      } else {
        // cleanup file asynchronously
        try {
          const fs = require('fs');
          fs.unlink(filePath, () => {});
        } catch (e) {}
      }
    });

  } catch (error) {
    next(error);
  }
};

// =============================
// 👤 CUSTOMER REPORT
// =============================
exports.downloadMyReport = async (req, res, next) => {
  try {
    const { month } = req.query;

    if (!month) {
      const err = new Error("Month parameter required");
      err.status = 400;
      throw err;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const { year, month: monthIndex } = parseBillingMonth(month);
    const { startDate, endDate } = getMonthDateRange(year, monthIndex);

    const entries = await MilkEntry.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const totalLitres = entries.reduce(
      (sum, e) => sum + (e.quantity || 0),
      0
    );

    const totalAmount = entries.reduce(
      (sum, e) => sum + (e.totalPrice || 0),
      0
    );

    const avgPrice =
      totalLitres > 0 ? (totalAmount / totalLitres).toFixed(2) : 0;

    // Generate customer report to a temp file and download
    const filename = generateInvoiceFilename(req.user.id.toString(), month || 'report');
    const filePath = path.join(TEMP_DIR, filename);

    await generateInvoicePDF(filePath, {
      customerName: user.username,
      customerPhone: user.phone || '',
      customerEmail: user.email || '',
      billingMonth: month,
      billingPeriodStart: startDate.toISOString().split('T')[0],
      billingPeriodEnd: endDate.toISOString().split('T')[0],
      totalLitres: Number(totalLitres.toFixed(2)),
      pricePerLitre: avgPrice,
      totalAmount: Number(totalAmount.toFixed(2)),
      entries,
      invoiceNumber: `report-${req.user.id}-${Date.now()}`,
      issueDate: new Date().toLocaleDateString('en-IN'),
    });

    res.download(filePath, filename, (err) => {
      if (err) {
        next(err);
      } else {
        try { require('fs').unlink(filePath, () => {}); } catch (e) {}
      }
    });

  } catch (error) {
    next(error);
  }
};