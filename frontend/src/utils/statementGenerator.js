import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { formatCurrency } from './format.js';

export function downloadStatementPDF(data) {
  const { customer, period, summary, sales = [], payments = [] } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Formatting date helpers
  const fmtD = (dStr) => {
    if (!dStr) return '';
    const date = new Date(dStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fmtDateFull = (dStr) => {
    if (!dStr) return '';
    const date = new Date(dStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Styling Variables
  const brandColor = [37, 99, 235]; // Brand Blue (RGB 37, 99, 235)
  const slate900 = [15, 23, 42];   // Slate-900
  const slate800 = [30, 41, 59];   // Slate-800
  const slate600 = [71, 85, 105];  // Slate-600
  const slate500 = [100, 116, 139]; // Slate-500
  const slate200 = [226, 232, 240]; // Slate-200

  // 1. Header (Logo on Left, Statement details on Right)
  // Accent vector stripe
  doc.setFillColor(...brandColor);
  doc.rect(15, 15, 5, 12, 'F');

  // Company Name
  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Diamond Pappadam', 23, 20);

  doc.setTextColor(...slate500);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('QUALITY PAPPADAMS & MEALS OUTLET', 23, 24.5);

  // Document Title
  doc.setTextColor(...brandColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CUSTOMER STATEMENT', 195, 20, { align: 'right' });

  // Period info
  doc.setTextColor(...slate600);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Period: ${fmtD(period.from)} - ${fmtD(period.to)}`, 195, 25, { align: 'right' });

  // Generated info
  doc.setTextColor(...slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Generated On: ${fmtD(new Date())}`, 195, 29, { align: 'right' });

  // Divider
  doc.setDrawColor(...slate200);
  doc.setLineWidth(0.4);
  doc.line(15, 33, 195, 33);

  // 2. Info Grid: Customer profile (Left) and Summary calculations (Right)
  // Customer Box (Left)
  doc.setTextColor(...slate500);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('STATEMENT FOR:', 15, 41);

  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(customer.name, 15, 46);

  doc.setTextColor(...slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Region: ${customer.place}`, 15, 51);
  doc.text(`Phone: ${customer.phone}`, 15, 56);

  // Summary Card (Right)
  const summaryBoxX = 115;
  const summaryBoxWidth = 80;
  doc.setFillColor(250, 250, 250); // slate-50 background
  doc.setDrawColor(...slate200);
  doc.rect(summaryBoxX, 37, summaryBoxWidth, 24, 'FD');

  const drawSummaryLine = (label, val, yPos, isBold = false) => {
    doc.setTextColor(...slate800);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(label, summaryBoxX + 4, yPos);
    doc.text(val, 191, yPos, { align: 'right' });
  };

  drawSummaryLine('Opening Balance:', `Rs. ${summary.openingBalance.toFixed(2)}`, 42);
  drawSummaryLine('Total Sales (Net):', `Rs. ${summary.totalSales.toFixed(2)}`, 47.5);
  drawSummaryLine('Total Payments:', `Rs. ${summary.totalPayments.toFixed(2)}`, 53);
  drawSummaryLine('Closing Balance:', `Rs. ${summary.closingBalance.toFixed(2)}`, 58.5, true);

  // Divider
  doc.line(15, 65, 195, 65);

  let currentY = 70;

  // 3. SALES SECTION
  if (sales.length > 0) {
    doc.setTextColor(...slate900);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SALES BILLINGS', 15, currentY);
    currentY += 4;

    const salesHeaders = [
      ['Date', 'Product Items', 'Qty', 'Rate', 'Amount', 'Discount', 'Final', 'Received', 'Balance']
    ];

    const salesBody = [];
    sales.forEach((s) => {
      // Loop sales items
      s.items.forEach((item, idx) => {
        const isFirst = idx === 0;
        salesBody.push([
          isFirst ? fmtDateFull(s.date) : '',
          `${item.description} (${item.unit})`,
          item.quantity.toString(),
          item.rate.toFixed(2),
          item.amount.toFixed(2),
          isFirst && s.discountAmount > 0 ? `-${s.discountAmount.toFixed(2)}` : '0.00',
          isFirst ? (s.finalSaleAmount !== undefined ? s.finalSaleAmount : s.totalAmount).toFixed(2) : '',
          isFirst ? s.receivedAmount.toFixed(2) : '',
          isFirst ? s.balanceAmount.toFixed(2) : '',
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY,
      head: salesHeaders,
      body: salesBody,
      theme: 'striped',
      headStyles: {
        fillColor: brandColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: slate800,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 10 },
        3: { halign: 'right', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 15 },
        6: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
        7: { halign: 'right', cellWidth: 15 },
        8: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
      },
      margin: { left: 15, right: 15 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 4. PAYMENTS SECTION
  if (payments.length > 0) {
    // Check page space
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(...slate900);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('STANDALONE PAYMENTS RECEIVED', 15, currentY);
    currentY += 4;

    const paymentsHeaders = [['Date', 'Amount Received', 'Notes / Remarks']];
    const paymentsBody = payments.map((p) => [
      fmtDateFull(p.date),
      `Rs. ${p.amount.toFixed(2)}`,
      p.notes || '—',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: paymentsHeaders,
      body: paymentsBody,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129], // emerald-500
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: slate800,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
      },
      margin: { left: 15, right: 15 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 5. CHRONOLOGICAL LEDGER SUMMARY
  // Check page space
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ACCOUNT LEDGER RUNNING SUMMARY', 15, currentY);
  currentY += 4;

  // Compile chronological transactions list
  const txs = [];
  
  // Push opening balance
  txs.push({
    type: 'opening-balance',
    date: new Date(period.from),
    description: 'Period Starting Balance (Prior Outstanding)',
    amount: summary.openingBalance,
    impact: summary.openingBalance,
  });

  // Push sales
  sales.forEach((s) => {
    const finalAmount = s.finalSaleAmount !== undefined ? s.finalSaleAmount : s.totalAmount;
    txs.push({
      type: 'sale',
      date: new Date(s.date),
      createdAt: s.createdAt,
      description: s.discountAmount > 0
        ? `Sale - Subtotal: Rs. ${s.totalAmount.toFixed(2)}, Discount: Rs. ${s.discountAmount.toFixed(2)}`
        : 'Sale billing',
      amount: finalAmount,
      impact: finalAmount,
    });

    if (s.receivedAmount > 0) {
      txs.push({
        type: 'received-sale',
        date: new Date(s.date),
        createdAt: s.createdAt,
        description: `Payment received during sale`,
        amount: s.receivedAmount,
        impact: -s.receivedAmount,
      });
    }
  });

  // Push standalone payments
  payments.forEach((p) => {
    txs.push({
      type: 'payment',
      date: new Date(p.date),
      createdAt: p.createdAt,
      description: p.notes ? `Payment received — ${p.notes}` : 'Standalone payment received',
      amount: p.amount,
      impact: -p.amount,
    });
  });

  // Sort chronologically (date, prioritize opening-balance, then sales, then payments/receipts, then createdAt)
  txs.sort((a, b) => {
    const dDiff = a.date - b.date;
    if (dDiff !== 0) return dDiff;
    
    if (a.type === 'opening-balance') return -1;
    if (b.type === 'opening-balance') return 1;

    // Tie breaker using createdAt if exists
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  // Compute running balance rows
  let runningBal = 0;
  const ledgerBody = txs.map((t) => {
    if (t.type === 'opening-balance') {
      runningBal = t.impact;
    } else {
      runningBal += t.impact;
    }

    let typeLabel = 'Sale';
    let impactText = `+Rs. ${t.amount.toFixed(2)}`;
    if (t.type === 'opening-balance') {
      typeLabel = 'Opening';
      impactText = '—';
    } else if (t.type === 'payment' || t.type === 'received-sale') {
      typeLabel = 'Payment';
      impactText = `-Rs. ${t.amount.toFixed(2)}`;
    }

    return [
      fmtDateFull(t.date),
      typeLabel,
      t.description,
      impactText,
      `Rs. ${runningBal.toFixed(2)}`,
    ];
  });

  const ledgerHeaders = [['Date', 'Type', 'Description / Details', 'Amount Impact', 'Running Balance']];

  autoTable(doc, {
    startY: currentY,
    head: ledgerHeaders,
    body: ledgerBody,
    theme: 'striped',
    headStyles: {
      fillColor: slate900,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: slate800,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
  });

  // 6. Page Numbers and Footers (Draw on all pages)
  const totalPages = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height || 297;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom thin line
    doc.setDrawColor(...slate200);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 15, 195, pageHeight - 15);

    // Footer text
    doc.setTextColor(...slate500);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('This is an official system generated account statement for Diamond Pappadam.', 15, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, 195, pageHeight - 10, { align: 'right' });
  }

  // Save the statement document
  const fileName = `Statement_${customer.name.replace(/\s+/g, '_')}_${period.from}_to_${period.to}.pdf`;
  doc.save(fileName);
  toast.success('Account statement PDF downloaded successfully');
}
