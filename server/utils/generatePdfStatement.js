import PDFDocument from 'pdfkit';

/**
 * Format currency without unrenderable unicode glyphs in default PDF fonts
 */
const fmtMoney = (val, currency = 'INR') => {
  const num = Number(val || 0);
  return `${currency} ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Generate a clean Notion-styled PDF financial statement buffer
 */
export const generateMonthlyPdfBuffer = async ({
  user,
  month,
  year,
  metrics,
  categoryBreakdown,
  transactions,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const periodName = `${monthNames[month - 1]} ${year}`;
      const currency = user.currency || 'INR';

      // --- 1. HEADER SECTION ---
      doc
        .rect(45, 40, 505, 65)
        .fill('#FBFBFA')
        .strokeColor('#E0E0DE')
        .lineWidth(1)
        .stroke();

      doc
        .fillColor('#1C1B1B')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('SpendWise', 60, 52);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#787774')
        .text('Personal Financial Ledger & Analytics', 60, 74);

      doc
        .fillColor('#1C1B1B')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('MONTHLY STATEMENT', 360, 52, { align: 'right', width: 175 });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#37352F')
        .text(`Period: ${periodName}`, 360, 68, { align: 'right', width: 175 })
        .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 360, 82, { align: 'right', width: 175 });

      doc.moveDown(3);

      // --- 2. ACCOUNT HOLDER INFO ---
      const infoY = 120;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#787774')
        .text('ACCOUNT HOLDER', 45, infoY)
        .text('BASE CURRENCY', 350, infoY);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1C1B1B')
        .text(user.name || 'Account Holder', 45, infoY + 14)
        .font('Helvetica')
        .fillColor('#787774')
        .text(user.email, 45, infoY + 28);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1C1B1B')
        .text(`${currency} - Indian Rupee`, 350, infoY + 14);

      // --- 3. FINANCIAL SUMMARY METRICS BOXES ---
      const metricsY = 175;
      const boxWidth = 118;
      const boxHeight = 52;
      const gap = 11;

      const summaryItems = [
        { label: 'TOTAL INFLOW', value: fmtMoney(metrics.monthlyIncome, currency), color: '#0F5132' },
        { label: 'TOTAL OUTFLOW', value: fmtMoney(metrics.monthlyExpenses, currency), color: '#1C1B1B' },
        { label: 'NET SAVINGS', value: fmtMoney(metrics.monthlySavings, currency), color: metrics.monthlySavings >= 0 ? '#0F5132' : '#842029' },
        { label: 'SAVINGS RATE', value: `${(metrics.savingsRate || 0).toFixed(1)}%`, color: '#1C1B1B' },
      ];

      summaryItems.forEach((item, index) => {
        const bx = 45 + index * (boxWidth + gap);
        doc
          .rect(bx, metricsY, boxWidth, boxHeight)
          .fill('#FFFFFF')
          .strokeColor('#E0E0DE')
          .lineWidth(1)
          .stroke();

        doc
          .fillColor('#787774')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(item.label, bx + 10, metricsY + 10);

        doc
          .fillColor(item.color)
          .fontSize(10.5)
          .font('Helvetica-Bold')
          .text(item.value, bx + 10, metricsY + 26);
      });

      // --- 4. CATEGORY BREAKDOWN TABLE ---
      let curY = 245;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1C1B1B')
        .text('Category Spending Distribution', 45, curY);

      curY += 18;

      // Table Header
      doc
        .rect(45, curY, 505, 20)
        .fill('#F7F6F3');

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#787774')
        .text('CATEGORY', 55, curY + 6)
        .text('TRANSACTIONS', 240, curY + 6)
        .text('% OF TOTAL', 360, curY + 6)
        .text('AMOUNT', 430, curY + 6, { align: 'right', width: 105 });

      curY += 20;

      if (!categoryBreakdown || categoryBreakdown.length === 0) {
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor('#787774')
          .text('No expense records logged for this calendar period.', 55, curY + 8);
        curY += 24;
      } else {
        categoryBreakdown.forEach((cat, idx) => {
          const rowBg = idx % 2 === 1 ? '#FAFAF9' : '#FFFFFF';
          doc.rect(45, curY, 505, 18).fill(rowBg);

          doc
            .fontSize(8.5)
            .font('Helvetica-Bold')
            .fillColor('#1C1B1B')
            .text(cat.name, 55, curY + 5)
            .font('Helvetica')
            .fillColor('#787774')
            .text(`${cat.count || 1} transactions`, 240, curY + 5)
            .text(`${(cat.percentage || 0).toFixed(1)}%`, 360, curY + 5)
            .font('Helvetica-Bold')
            .fillColor('#1C1B1B')
            .text(fmtMoney(cat.amount, currency), 430, curY + 5, { align: 'right', width: 105 });

          curY += 18;
        });
      }

      curY += 15;

      // --- 5. ITEMIZED TRANSACTIONS LEDGER ---
      if (curY > 600) {
        doc.addPage();
        curY = 45;
      }

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1C1B1B')
        .text(`Transaction Ledger (${transactions.length} records)`, 45, curY);

      curY += 18;

      // Ledger Table Header
      doc.rect(45, curY, 505, 20).fill('#F7F6F3');

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#787774')
        .text('DATE', 55, curY + 6)
        .text('DESCRIPTION', 125, curY + 6)
        .text('CATEGORY', 270, curY + 6)
        .text('METHOD', 370, curY + 6)
        .text('AMOUNT', 440, curY + 6, { align: 'right', width: 95 });

      curY += 20;

      if (!transactions || transactions.length === 0) {
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor('#787774')
          .text('No ledger transactions recorded for this period.', 55, curY + 8);
      } else {
        transactions.forEach((tx, idx) => {
          if (curY > 740) {
            doc.addPage();
            curY = 45;

            // Header on new page
            doc.rect(45, curY, 505, 20).fill('#F7F6F3');
            doc
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#787774')
              .text('DATE', 55, curY + 6)
              .text('DESCRIPTION', 125, curY + 6)
              .text('CATEGORY', 270, curY + 6)
              .text('METHOD', 370, curY + 6)
              .text('AMOUNT', 440, curY + 6, { align: 'right', width: 95 });
            curY += 20;
          }

          const rowBg = idx % 2 === 1 ? '#FAFAF9' : '#FFFFFF';
          doc.rect(45, curY, 505, 18).fill(rowBg);

          const dateStr = new Date(tx.transactionDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const catName = tx.categoryId?.name || 'Uncategorized';
          const isIncome = tx.type === 'income';

          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#787774')
            .text(dateStr, 55, curY + 5)
            .font('Helvetica-Bold')
            .fillColor('#1C1B1B')
            .text((tx.title || 'Transaction').substring(0, 24), 125, curY + 5)
            .font('Helvetica')
            .fillColor('#555555')
            .text(catName.substring(0, 18), 270, curY + 5)
            .text(tx.paymentMethod || 'Other', 370, curY + 5)
            .font('Helvetica-Bold')
            .fillColor(isIncome ? '#0F5132' : '#1C1B1B')
            .text(`${isIncome ? '+' : '-'}${fmtMoney(tx.amount, currency)}`, 440, curY + 5, {
              align: 'right',
              width: 95,
            });

          curY += 18;
        });
      }

      // --- 6. PAGE NUMBERS & FOOTER ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc
          .strokeColor('#E0E0DE')
          .lineWidth(0.5)
          .moveTo(45, 785)
          .lineTo(550, 785)
          .stroke();

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#9E9E9E')
          .text(
            'SpendWise Financial Ledger • Confidential • Retain for Personal Accounting',
            45,
            792
          )
          .text(`Page ${i + 1} of ${totalPages}`, 350, 792, { align: 'right', width: 200 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate CSV string from transactions list
 */
export const generateMonthlyCsvString = (transactions, currency = 'INR') => {
  const headers = ['Date', 'Title', 'Type', 'Category', 'Payment Method', `Amount (${currency})`, 'Notes'];
  const rows = transactions.map((t) => [
    new Date(t.transactionDate).toISOString().split('T')[0],
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.type,
    `"${(t.categoryId?.name || 'Other').replace(/"/g, '""')}"`,
    `"${(t.paymentMethod || 'Other').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};
