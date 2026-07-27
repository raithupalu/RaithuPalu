import jsPDF from 'jspdf';
import logo from '../assets/images/logo/logo.png';

let logoDataUrlPromise = null;

const getLogoDataUrl = () => {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(logo)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  }
  return logoDataUrlPromise;
};

export const generateInvoicePDF = async (customerName, month, entries, totals) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  try {
    const dataUrl = await getLogoDataUrl();
    const props = await doc.getImageProperties(dataUrl);
    const maxWidth = 45;
    const ratio = props.height / props.width;
    const logoWidth = maxWidth;
    const logoHeight = maxWidth * ratio;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(dataUrl, 'PNG', logoX, y, logoWidth, logoHeight);
    y += logoHeight + 8;
  } catch (err) {
    // Fall back to text-only header if logo fails
  }

  doc.setFontSize(20);
  doc.setTextColor(45, 95, 63);
  doc.text('Milk Invoice', pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Customer: ${customerName}`, 20, y);
  y += 8;
  doc.text(`Month: ${month}`, 20, y);
  y += 15;

  doc.setDrawColor(45, 95, 63);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const headers = ['Date', 'Session', 'Quantity', 'Price', 'Type'];
  const colWidths = [45, 30, 30, 30, 35];
  let x = 20;

  headers.forEach((header, i) => {
    doc.text(header, x, y);
    x += colWidths[i];
  });
  y += 8;

  doc.setLineWidth(0.2);
  doc.line(20, y, pageWidth - 20, y);
  y += 5;

  entries.forEach((entry) => {
    const date = new Date(entry.date).toLocaleDateString('en-IN');
    const session = entry.session.charAt(0).toUpperCase() + entry.session.slice(1);
    const quantity = entry.quantity >= 1 ? `${entry.quantity}L` : `${entry.quantity * 1000}ml`;
    const price = `₹${entry.totalPrice.toFixed(2)}`;
    const typeText = entry.entryType === 'ORDER' ? 'Ordered' : 'Normal';

    x = 20;
    doc.text(date, x, y);
    x += colWidths[0];
    doc.text(session, x, y);
    x += colWidths[1];
    doc.text(quantity, x, y);
    x += colWidths[2];
    doc.text(price, x, y);
    x += colWidths[3];
    doc.text(typeText, x, y);
    y += 7;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(45, 95, 63);
  doc.text(`Total Litres: ${totals.totalLitres.toFixed(2)}L`, 20, y);
  y += 8;
  doc.text(`Total Amount: ₹${totals.totalPrice.toFixed(2)}`, 20, y);

  const fileName = `Invoice_${customerName}_${month}.pdf`;
  doc.save(fileName);

  return fileName;
};