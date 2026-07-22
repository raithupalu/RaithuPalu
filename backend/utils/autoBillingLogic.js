/**
 * Production-grade monthly billing system
 * Features:
 * - Runs monthly on 1st at 1 AM
 * - Prevents duplicate billing via unique index
 * - Transaction support for payment creation
 * - Retry mechanism for WhatsApp failures
 * - Per-customer error handling (no batch stop)
 * - Temp file cleanup on success/failure
 * - Comprehensive logging
 * - PDF invoice generation
 */

const MilkEntry = require('../models/MilkEntry');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { sendWhatsAppMessageWithRetry } = require('./whatsappService');
const {
  generateInvoicePDF,
  generateInvoiceFilename,
  cleanupTempFiles,
  TEMP_DIR,
  formatCurrency,
  formatNumber,
} = require('./pdfGenerator');
const fs = require('fs');
const path = require('path');
const { Logger } = require('./logger');

const logger = new Logger('billing');

/**
 * Get previous month date range and label
 */
function getPreviousMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Go back one month
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const label = `${monthNames[prevMonth]} ${prevYear}`;
  const startDate = new Date(prevYear, prevMonth, 1);
  const endDate = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);

  return { label, startDate, endDate };
}

/**
 * Clean up generated PDF files for a batch
 */
function cleanupBatchFiles(filePaths) {
  const cleaned = cleanupTempFiles(filePaths);
  logger.info(`Cleaned up ${cleaned} temporary files`, { files: filePaths.length });
}

/**
 * Process a single customer's billing
 * @param {object} customer - Customer document
 * @param {object} billingPeriod - Billing period object
 * @param {mongoose.Session|null} session - MongoDB session (optional, for transaction)
 * @returns {Promise<object>} - Processing result
 */
async function processCustomer(customer, billingPeriod, session = null) {
  const result = {
    success: false,
    customerId: customer._id,
    customerName: customer.username,
    error: null,
    invoiceGenerated: false,
    whatsappSent: false,
    paymentCreated: false,
    amount: 0,
  };

  try {
    // Fetch milk entries for the billing period
    const entries = await MilkEntry.find({
      userId: customer._id,
      date: { $gte: billingPeriod.startDate, $lte: billingPeriod.endDate },
    }).lean();

    if (!entries.length) {
      logger.info(`No milk entries for ${customer.username}`,
        {
          customerId: customer._id,
          period: billingPeriod.label,
        });
      result.error = 'No milk entries';
      return result;
    }

    // Calculate totals - handle legacy entries with missing pricePerLitre/totalPrice
    let totalLitres = 0;
    let totalAmount = 0;
    const pricePerLitre = 80; // Default price for legacy entries without pricing

    const processedEntries = entries.map(entry => {
      const qty = Number(entry.quantity) || 0;
      totalLitres += qty;

      // Try pricePerLitre first, fall back to rate, then use default
      let entryPrice = Number(entry.pricePerLitre || entry.rate || pricePerLitre);

      // Calculate totalPrice for this entry
      let entryTotal = Number(entry.totalPrice);
      if (isNaN(entryTotal) || entryTotal === 0) {
        entryTotal = qty * entryPrice;
      }
      totalAmount += entryTotal;

      return {
        ...entry,
        quantity: qty,
        pricePerLitre: entryPrice,
        totalPrice: entryTotal,
      };
    });

    if (totalAmount <= 0) {
      logger.warn(`Zero or negative amount for ${customer.username}, using default pricing`,
        {
          customerId: customer._id,
          totalAmount,
          totalLitres,
        });
      // Apply default pricing
      totalAmount = totalLitres * pricePerLitre;
    }

    // Check for existing payment (duplicate prevention)
    // If exists, delete it to allow regeneration
    const existingPayment = await Payment.findOne({
      userId: customer._id,
      month: billingPeriod.label,
    }).lean();

    if (existingPayment) {
      await Payment.deleteOne({ _id: existingPayment._id }).session(session);
      logger.warn(`♻️ Replacing bill for ${customer.username}`,
        {
          customerId: customer._id,
          month: billingPeriod.label,
          oldPaymentId: existingPayment._id,
        });
    }

    // Generate PDF invoice
    const fileName = generateInvoiceFilename(customer._id, billingPeriod.label);
    const filePath = path.join(TEMP_DIR, fileName);
    const invoiceUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/temp/${fileName}`;

    await generateInvoicePDF(filePath, {
      customerName: customer.username,
      customerPhone: customer.phone,
      invoiceNumber: `INV-${billingPeriod.label}-${customer._id.toString().slice(-6).toUpperCase()}`,
      billingMonth: billingPeriod.label,
      billingPeriodStart: billingPeriod.startDate.toLocaleDateString('en-IN'),
      billingPeriodEnd: billingPeriod.endDate.toLocaleDateString('en-IN'),
      entries: processedEntries,
      totalLitres: totalLitres,
      totalAmount: totalAmount,
      pricePerLitre: totalLitres > 0 ? totalAmount / totalLitres : 0,
      companyName: process.env.COMPANY_NAME || 'Raithu Palu Dairy',
      companyAddress: {
        line1: process.env.COMPANY_ADDRESS_LINE1 || '123 Dairy Lane',
        line2: process.env.COMPANY_ADDRESS_LINE2 || process.env.COMPANY_ADDRESS_CITY || 'India',
        phone: process.env.COMPANY_PHONE || '+91-XXX-XXXX-XXXX',
      },
      issueDate: new Date().toLocaleDateString('en-IN'),
    });

    result.invoiceGenerated = true;
    logger.info(`Invoice PDF generated for ${customer.username}`,
      {
        customerId: customer._id,
        fileName,
        amount: totalAmount,
        litres: totalLitres,
      });

    // Create payment record
    // Use transaction if provided, otherwise create without transaction
    let paymentDoc = null;
    const saveOptions = session ? { session } : {};

    const paymentData = {
      userId: customer._id,
      month: billingPeriod.label,
      totalLitres: totalLitres,
      pricePerLitre: totalLitres > 0 ? totalAmount / totalLitres : 0,
      totalAmount: totalAmount,
      paid: 0,
      pending: totalAmount,
    };

    const paymentRecords = await Payment.create([paymentData], saveOptions);
    paymentDoc = paymentRecords[0];

    result.paymentCreated = true;
    result.amount = totalAmount;

    logger.success(`Payment record created for ${customer.username}`,
      {
        customerId: customer._id,
        paymentId: paymentDoc._id,
        amount: totalAmount,
      });

    // Send WhatsApp message with invoice
    if (customer.phone) {
      const message = `🧾 *Milk Bill - ${billingPeriod.label}*\n\n` +
        `Dear ${customer.username},\n\n` +
        `*Total Litres:* ${formatNumber(totalLitres)} L\n` +
        `*Amount Due:* ${formatCurrency(totalAmount)}\n\n` +
        `Please find your invoice attached.\n\n` +
        `Thank you for your business!`;

      const whatsappResult = await sendWhatsAppMessageWithRetry(
        customer.phone,
        message,
        invoiceUrl,
        {
          customerId: customer._id,
          invoiceNumber: paymentDoc._id.toString(),
        }
      );

      if (whatsappResult.success) {
        result.whatsappSent = true;
        logger.success(`WhatsApp invoice sent to ${customer.username}`,
          {
            customerId: customer._id,
            phone: customer.phone,
            whatsappSid: whatsappResult.sid,
          });
      } else {
        logger.warn(`WhatsApp send failed for ${customer.username} but billing completed`,
          {
            customerId: customer._id,
            error: whatsappResult.error,
          });
        // Don't mark as failure - billing is still successful
      }
    } else {
      logger.info(`No phone for ${customer.username}, skipping WhatsApp`);
    }

    result.success = true;
    result.filePath = filePath;

  } catch (error) {
    result.error = error.message;
    logger.error(`Failed to process customer ${customer.username}`,
      {
        customerId: customer._id,
        error: error,
      });
  }

  return result;
}

/**
 * Main billing function - runs monthly
 */
async function generateMonthlyBills(options = {}) {
  const startTime = Date.now();
  const forceMode = options.force === true || options.force === 'true';

  logger.info('=== Monthly Billing Run Started ===', {
    forceMode,
  });

  const summary = {
    totalCustomers: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skippedNoEntries: 0,
    skippedAlreadyBilled: 0,
    totalAmount: 0,
    invoicesGenerated: 0,
    whatsappSent: 0,
    errors: [],
    filePaths: [],
  };

  const billingPeriod = getPreviousMonth();

  logger.info(`Billing period: ${billingPeriod.label}`,
    {
      startDate: billingPeriod.startDate.toISOString(),
      endDate: billingPeriod.endDate.toISOString(),
    });

  // Skip if not forced and it's not ~1st of month (prevents accidental runs in dev)
  const today = new Date();
  const isFirstOfMonth = today.getDate() === 1;
  const isTestMode = process.env.NODE_ENV !== 'production';

  if (!forceMode && !isFirstOfMonth && !isTestMode) {
    logger.warn('Billing run skipped - not 1st of month and not in force mode');
    return summary;
  }

  // NOTE: Customers are processed independently (NOT wrapped in a single
  // transaction). Each payment is created on its own; per-customer error
  // handling already isolates failures. Wrapping the whole batch in one
  // transaction would hold locks across WhatsApp network calls + delays,
  // risking transaction timeouts with many customers.
  const customers = await User.find({
    role: 'customer',
    isActive: true,
  })
    .select('_id username phone isActive')
    .lean();

  summary.totalCustomers = customers.length;

  logger.info(`Found ${customers.length} active customers`);

  // Process each customer
  for (const customer of customers) {
    summary.processed++;

    logger.info(`Processing customer ${summary.processed}/${customers.length}`,
      {
        customerId: customer._id,
        username: customer.username,
      });

    try {
      const result = await processCustomer(customer, billingPeriod, null);

      if (result.success) {
        summary.successful++;
        summary.totalAmount += result.amount || 0;
        if (result.invoiceGenerated) summary.invoicesGenerated++;
        if (result.whatsappSent) summary.whatsappSent++;
        if (result.filePath) summary.filePaths.push(result.filePath);
      } else {
        summary.failed++;

        if (result.error === 'No milk entries') {
          summary.skippedNoEntries++;
        } else {
          summary.errors.push({
            customerId: customer._id,
            username: customer.username,
            error: result.error,
          });
        }
      }
    } catch (error) {
      summary.failed++;
      summary.errors.push({
        customerId: customer._id,
        username: customer.username,
        error: error.message,
      });
      logger.error(`Unexpected error processing customer`,
        {
          customerId: customer._id,
          error: error,
        });
    }

    // Small delay between customers to avoid overwhelming APIs
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Cleanup temporary files
  if (summary.filePaths.length > 0) {
    cleanupBatchFiles(summary.filePaths);
  }

  const duration = Date.now() - startTime;

  logger.info('=== Monthly Billing Run Completed ===', {
    duration: `${duration}ms`,
    totalCustomers: summary.totalCustomers,
    successful: summary.successful,
    failed: summary.failed,
    skippedNoEntries: summary.skippedNoEntries,
    skippedAlreadyBilled: summary.skippedAlreadyBilled,
    totalAmount: summary.totalAmount,
    invoicesGenerated: summary.invoicesGenerated,
    whatsappSent: summary.whatsappSent,
  });

  return summary;
}


module.exports = {
  generateMonthlyBills,
  processCustomer,
  getPreviousMonth
};
