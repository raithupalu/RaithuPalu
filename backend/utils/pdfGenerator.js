const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Temp directory for invoice storage
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Currency formatter for INR
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Number formatter with 2 decimal places
function formatNumber(num) {
  return num.toFixed(2);
}

/**
 * Generate a professional PDF invoice for milk billing
 * @param {string} filePath - Output file path
 * @param {object} data - Invoice data
 * @param {string} data.customerName - Customer name
 * @param {string} data.customerPhone - Customer phone (optional)
 * @param {string} data.invoiceNumber - Unique invoice number
 * @param {string} data.billingMonth - Billing month label (e.g., "April 2026")
 * @param {string} data.billingPeriodStart - Start date
 * @param {string} data.billingPeriodEnd - End date
 * @param {Array} data.entries - Milk entry records
 * @param {number} data.totalLitres - Total litres
 * @param {number} data.totalAmount - Total amount due
 * @param {number} data.pricePerLitre - Price per litre
 * @param {string} data.companyName - Company name
 * @param {object} data.companyAddress - Company address
 * @param {string} data.issueDate - Invoice issue date
 */
function generateInvoicePDF(filePath, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Register fonts
    const headerFontSize = 18;
    const sectionFontSize = 12;
    const bodyFontSize = 10;
    const smallFontSize = 8;

    const pageWidth = doc.page.width;
    const leftMargin = 50;
    const rightMargin = pageWidth - 50;
    const centerX = pageWidth / 2;

    // Helper to add section headers
    const addSectionHeader = (text, y) => {
      doc.fontSize(11).font('Helvetica-Bold').text(text, leftMargin, y);
      return doc.y + 5;
    };

    // Helper to add row
    const addRow = (label, value, y, labelColor = '#555') => {
      doc.fontSize(bodyFontSize).fillColor(labelColor).text(`${label}:`, leftMargin, y);
      doc.fontSize(bodyFontSize).fillColor('#000').text(value, leftMargin + 150, y);
      return doc.y + 5;
    };

    try {
      // ============ HEADER ============
      // Company info (left)
      doc.fontSize(headerFontSize).font('Helvetica-Bold').fillColor('#1a365d')
        .text(data.companyName || 'Raithu Palu Dairy', leftMargin, 50);
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(data.companyAddress?.line1 || '123 Dairy Lane', leftMargin, 75);
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(data.companyAddress?.line2 || '', leftMargin, 90);
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(`Phone: ${data.companyAddress?.phone || 'N/A'}`, leftMargin, 105);

      // Invoice label (right)
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a365d')
        .text('INVOICE', rightMargin - 80, 50, { align: 'right' });

      // Invoice number
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(`Invoice #: ${data.invoiceNumber}`, rightMargin - 80, 70, { align: 'right' });

      // Issue date
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(`Issue Date: ${data.issueDate}`, rightMargin - 80, 85, { align: 'right' });

      // Billing month highlight
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2d5a87')
        .text(data.billingMonth, rightMargin - 80, 105, { align: 'right' });

      // Divider line
      doc.moveTo(leftMargin, 125).lineTo(rightMargin, 125).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // ============ BILL TO ============
      let yPos = addSectionHeader('Bill To', 135);
      yPos += 5;
      doc.fontSize(bodyFontSize).fillColor('#000').text(data.customerName, leftMargin, yPos);
      if (data.customerPhone) {
        doc.fontSize(smallFontSize).fillColor('#666').text(`Phone: ${data.customerPhone}`, leftMargin, yPos + 15);
      }
      yPos += 35;

      // Billing period
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(`Billing Period: ${data.billingPeriodStart} to ${data.billingPeriodEnd}`, leftMargin, yPos);
      yPos += 25;

      // ============ LINE ITEMS ============
      yPos = addSectionHeader('Milk Entries', yPos);

      // Table header
      const tableTop = yPos;
      const colDate = leftMargin;
      const colSession = leftMargin + 90;
      const colQty = leftMargin + 200;
      const colPrice = leftMargin + 260;
      const colTotal = leftMargin + 350;

      doc.fontSize(smallFontSize).font('Helvetica-Bold').fillColor('#000');
      doc.text('Date', colDate, tableTop);
      doc.text('Session', colSession, tableTop);
      doc.text('Quantity (L)', colQty, tableTop);
      doc.text('Price/L (₹)', colPrice, tableTop);
      doc.text('Amount (₹)', colTotal, tableTop);

      // Horizontal line under header
      doc.moveTo(leftMargin, tableTop + 15).lineTo(rightMargin, tableTop + 15)
        .strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      yPos = tableTop + 22;
      doc.fontSize(smallFontSize).font('Helvetica').fillColor('#000');

      // Table rows
      data.entries.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString('en-IN');
        const session = entry.session ? entry.session.charAt(0).toUpperCase() + entry.session.slice(1) : '';
        const quantity = formatNumber(entry.quantity || 0);
        const price = formatNumber(entry.pricePerLitre || 0);
        const total = formatNumber(entry.totalPrice || 0);

        doc.text(date, colDate, yPos);
        doc.text(session, colSession, yPos);
        doc.text(quantity, colQty, yPos, { align: 'right' });
        doc.text(price, colPrice, yPos, { align: 'right' });
        doc.text(total, colTotal, yPos, { align: 'right' });

        yPos += 16;

        // Check if we need a new page
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      // ============ TOTALS ============
      yPos += 10;
      doc.moveTo(leftMargin, yPos).lineTo(rightMargin, yPos)
        .strokeColor('#cbd5e1').lineWidth(1).stroke();
      yPos += 15;

      const totalsCol = leftMargin + 300;
      const totalsValue = leftMargin + 410;

      doc.fontSize(smallFontSize).fillColor('#000')
        .text('Total Litres:', totalsCol, yPos);
      doc.fontSize(smallFontSize).font('Helvetica-Bold').fillColor('#000')
        .text(formatNumber(data.totalLitres) + ' L', totalsValue, yPos, { align: 'right' });
      yPos += 20;

      doc.fontSize(smallFontSize).fillColor('#000')
        .text(`Price Per Litre:`, totalsCol, yPos);
      doc.fontSize(smallFontSize).font('Helvetica-Bold').fillColor('#000')
        .text(formatCurrency(data.pricePerLitre || 0), totalsValue, yPos, { align: 'right' });
      yPos += 25;

      doc.moveTo(leftMargin, yPos).lineTo(rightMargin, yPos)
        .strokeColor('#1a365d').lineWidth(2).stroke();
      yPos += 15;

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a365d')
        .text('Total Amount:', totalsCol, yPos);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a365d')
        .text(formatCurrency(data.totalAmount), totalsValue, yPos, { align: 'right' });

      // ============ FOOTER ============
      doc.addPage();
      doc.fontSize(smallFontSize).fillColor('#666')
        .text(`Generated: ${new Date().toISOString()}`, leftMargin, 50);
      doc.fontSize(smallFontSize).fillColor('#666')
        .text('This invoice was generated automatically by the Raithu Palu billing system.', leftMargin, 65);

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clean up temporary invoice files
 * @param {Array<string>} files - Array of file paths to delete
 */
function cleanupTempFiles(files = []) {
  const allFiles = fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR) : [];
  const targetFiles = files.length > 0 ? files.map(f => path.basename(f)) : allFiles;
  
  let cleaned = 0;
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  targetFiles.forEach(filename => {
    const filepath = path.join(TEMP_DIR, filename);
    try {
      const stats = fs.statSync(filepath);
      // Delete if older than 7 days OR explicitly listed
      if (files.length > 0 || (now - stats.mtimeMs) > maxAge) {
        fs.unlinkSync(filepath);
        cleaned++;
      }
    } catch (e) {
      // File might not exist, ignore
    }
  });

  return cleaned;
}

/**
 * Generate unique filename for invoice
 * @param {string} customerId - Customer ID
 * @param {string} billingMonth - Billing month label
 * @returns {string} - Generated filename
 */
function generateInvoiceFilename(customerId, billingMonth) {
  const monthSlug = billingMonth.toLowerCase().replace(/\s+/g, '-');
  const timestamp = Date.now();
  return `invoice-${customerId}-${monthSlug}-${timestamp}.pdf`;
}

module.exports = {
  generateInvoicePDF,
  generateInvoiceFilename,
  cleanupTempFiles,
  TEMP_DIR,
  formatCurrency,
  formatNumber,
};
