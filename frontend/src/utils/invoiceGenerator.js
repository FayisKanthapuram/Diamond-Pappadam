import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from './format.js';

// 1. Establish a chronological invoice number
export function getInvoiceNumber(sale, allSales) {
  if (!sale) return 'INV-0000';
  const sortedSales = [...allSales].sort((a, b) => {
    const dDiff = new Date(a.date) - new Date(b.date);
    if (dDiff !== 0) return dDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  const index = sortedSales.findIndex((s) => s.id === sale.id || s._id === sale.id || s.id === sale._id || s._id === sale._id);
  const serial = index !== -1 ? index + 1 : sortedSales.length;
  return `INV-${String(serial).padStart(4, '0')}`;
}

// 3. Generate jsPDF Document
export function generateInvoicePDFDoc(sale, customer, allSales, allPayments) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const invoiceNumber = getInvoiceNumber(sale, allSales);
  
  const subtotalAmount = sale.subtotalAmount || sale.totalAmount || 0;
  const discountAmount = sale.discountAmount || 0;
  const finalSaleAmount = sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : (subtotalAmount - discountAmount);
  
  const prevBalance = sale.previousBalance || 0;
  const totalDue = prevBalance + finalSaleAmount;
  const received = sale.receivedAmount || 0;
  const currentBalance = sale.balanceAfterSale !== undefined ? sale.balanceAfterSale : (finalSaleAmount - received);

  // Styling Variables
  const brandColor = [37, 99, 235]; // Brand Blue (RGB 37, 99, 235)
  const slate900 = [15, 23, 42];   // Slate-900
  const slate800 = [30, 41, 59];   // Slate-800
  const slate600 = [71, 85, 105];  // Slate-600
  const slate500 = [100, 116, 139]; // Slate-500
  const slate200 = [226, 232, 240]; // Slate-200

  // 1. Header (Left-aligned Logo/Title & Right-aligned Doc Details)
  // Accent vector stripe
  doc.setFillColor(...brandColor);
  doc.rect(15, 15, 8, 12, 'F');

  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('DIAMOND PAPPADAM', 27, 21.5);

  doc.setTextColor(...brandColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('QUALITY PAPPADAM MANUFACTURERS', 27, 26);

  // Invoice label & details (Right-aligned)
  doc.setTextColor(...brandColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', 195, 22, { align: 'right' });

  doc.setTextColor(...slate800);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Invoice No: ${invoiceNumber}`, 195, 28, { align: 'right' });

  doc.setTextColor(...slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Date: ${formatDate(sale.date)}`, 195, 33, { align: 'right' });

  // Divider Line
  doc.setDrawColor(...slate200);
  doc.setLineWidth(0.5);
  doc.line(15, 38, 195, 38);

  // 2. Customer Details Section (Bill To)
  let y = 46;
  doc.setTextColor(...slate500);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILLED TO:', 15, y);

  y += 5.5;
  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(customer.name, 15, y);

  y += 5;
  doc.setTextColor(...slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Phone: ${customer.phone}`, 15, y);

  y += 4.5;
  doc.text(`Place: ${customer.place}`, 15, y);

  // 3. Items Table
  const tableHeaders = [['Description', 'Unit', 'Quantity', 'Rate (Rs)', 'Amount (Rs)']];
  const tableBody = sale.items.map((item) => [
    item.description,
    item.unit,
    Number(item.quantity).toFixed(2),
    Number(item.rate).toFixed(2),
    Number(item.amount).toFixed(2),
  ]);

  autoTable(doc, {
    startY: y + 8,
    head: tableHeaders,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: brandColor,
      textColor: 255,
      fontSize: 9.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: slate800,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 },
    },
    margin: { left: 15, right: 15 },
  });

  // 4. Ledger Summary and Notes (below the table)
  let nextY = doc.lastAutoTable.finalY + 10;

  // If nextY is near bottom, insert page break to keep summary intact
  if (nextY > 205) {
    doc.addPage();
    nextY = 20;
  }

  // Draw Notes on the left if notes exist
  if (sale.notes && sale.notes.trim()) {
    doc.setTextColor(...slate500);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('INVOICE NOTES:', 15, nextY + 4);

    doc.setTextColor(...slate800);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    
    // Split and wrap note content
    const wrappedNotes = doc.splitTextToSize(sale.notes.trim(), 80);
    doc.text(wrappedNotes, 15, nextY + 9);
  }

  // Draw Summary Box on the right (Width: 80mm, from X=115 to X=195)
  const summaryBoxX = 115;
  const summaryBoxWidth = 80;
  
  // Outer rectangle for summary
  doc.setFillColor(250, 250, 250); // slate-50 background
  doc.setDrawColor(...slate200);
  doc.rect(summaryBoxX, nextY, summaryBoxWidth, 58, 'FD');

  let itemY = nextY + 6;

  // Helper function to draw row inside box
  const drawSummaryRow = (label, val, isBold = false) => {
    doc.setTextColor(...slate800);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(label, summaryBoxX + 4, itemY);
    doc.text(val, 191, itemY, { align: 'right' });
    itemY += 6.5;
  };

  drawSummaryRow('Subtotal Amount:', `Rs. ${subtotalAmount.toFixed(2)}`);
  if (discountAmount > 0) {
    const reasonText = sale.discountReason ? ` (${sale.discountReason})` : '';
    drawSummaryRow(`Discount${reasonText}:`, `-Rs. ${discountAmount.toFixed(2)}`);
  }
  drawSummaryRow('Net Sale Amount:', `Rs. ${finalSaleAmount.toFixed(2)}`);
  drawSummaryRow('Previous Balance:', `Rs. ${prevBalance.toFixed(2)}`);
  drawSummaryRow('Total Due:', `Rs. ${totalDue.toFixed(2)}`, true);
  drawSummaryRow('Amount Received:', `Rs. ${received.toFixed(2)}`);

  // Current Balance (Outstanding) highlight row
  const hasOutstanding = currentBalance > 0;
  if (hasOutstanding) {
    doc.setFillColor(254, 242, 242); // light red (rose-50)
    doc.setTextColor(220, 38, 38);   // dark red text
  } else {
    doc.setFillColor(240, 253, 244); // light green (emerald-50)
    doc.setTextColor(22, 163, 74);   // dark green text
  }
  
  // Highlight rect
  doc.rect(summaryBoxX + 1, itemY - 4.5, summaryBoxWidth - 2, 9, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Current Balance:', summaryBoxX + 4, itemY + 1.5);
  doc.text(`Rs. ${currentBalance.toFixed(2)}`, 191, itemY + 1.5, { align: 'right' });

  // 5. Footer (Always at the bottom of the page)
  const pageHeight = doc.internal.pageSize.height || 297;
  
  doc.setDrawColor(...slate200);
  doc.setLineWidth(0.3);
  doc.line(15, pageHeight - 20, 195, pageHeight - 20);

  doc.setTextColor(...slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business.', 105, pageHeight - 14, { align: 'center' });
  doc.setTextColor(...brandColor);
  doc.setFont('helvetica', 'bold');
  doc.text('DIAMOND PAPPADAM', 105, pageHeight - 9, { align: 'center' });

  return doc;
}

// 4. Download Trigger
export function downloadInvoice(sale, customer, allSales, allPayments) {
  try {
    const doc = generateInvoicePDFDoc(sale, customer, allSales, allPayments);
    const invoiceNumber = getInvoiceNumber(sale, allSales);
    doc.save(`Invoice-${invoiceNumber}.pdf`);
    toast.success('Invoice PDF downloaded successfully');
  } catch (err) {
    toast.error('Failed to download invoice PDF');
    console.error(err);
  }
}

// 5. Web Share API Trigger
export async function shareInvoice(sale, customer, allSales, allPayments, onShareSuccess) {
  try {
    const doc = generateInvoicePDFDoc(sale, customer, allSales, allPayments);
    const pdfBlob = doc.output('blob');
    const invoiceNumber = getInvoiceNumber(sale, allSales);
    const fileName = `Invoice-${invoiceNumber}.pdf`;
    
    // Create File object for Web Share
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `Diamond Pappadam Invoice - ${invoiceNumber}`,
        text: `Please find attached the invoice ${invoiceNumber} from Diamond Pappadam for ${customer.name}.`,
        files: [pdfFile],
      });

      if (onShareSuccess) {
        await onShareSuccess(sale.id || sale._id);
      }
      return { success: true };
    } else {
      toast.error('Sharing is not supported on this device.');
      return { success: false, notSupported: true };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // User cancelled sharing, handle silently without toast error
      return { success: false, aborted: true };
    }
    toast.error('Failed to share invoice.');
    console.error(err);
    return { success: false };
  }
}
