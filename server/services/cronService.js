import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { generateMonthlyPdfBuffer, generateMonthlyCsvString } from '../utils/generatePdfStatement.js';
import { sendEmail, generateStatementEmailTemplate } from '../utils/sendEmail.js';

/**
 * Dispatch monthly financial statement to a specific user
 */
export const dispatchStatementForUser = async (user, month, year) => {
  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId: user._id,
      transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('categoryId', 'name icon color type')
      .sort({ transactionDate: -1 });

    if (!transactions || transactions.length === 0) {
      console.log(`ℹ️ User ${user.email} had 0 transactions in month ${month}/${year}. Skipping dispatch.`);
      return { skipped: true, reason: 'No transactions' };
    }

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    const catMap = new Map();

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        monthlyIncome += tx.amount;
      } else {
        monthlyExpenses += tx.amount;
        const catName = tx.categoryId?.name || 'Other';
        const current = catMap.get(catName) || { name: catName, amount: 0, count: 0 };
        current.amount += tx.amount;
        current.count += 1;
        catMap.set(catName, current);
      }
    });

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const categoryBreakdown = Array.from(catMap.values())
      .map((c) => ({
        ...c,
        percentage: monthlyExpenses > 0 ? (c.amount / monthlyExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const periodName = `${monthNames[month - 1]} ${year}`;

    // 1. Generate PDF Statement
    const pdfBuffer = await generateMonthlyPdfBuffer({
      user,
      month,
      year,
      metrics: {
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
      },
      categoryBreakdown,
      transactions,
    });

    // 2. Generate CSV Ledger
    const csvContent = generateMonthlyCsvString(transactions, user.currency || 'INR');

    // 3. Dispatch Email
    await sendEmail({
      to: user.email,
      subject: `SpendWise: Monthly Financial Statement & CSV for ${periodName}`,
      text: `Hello ${user.name},\n\nPlease find attached your automated SpendWise monthly financial statement and CSV ledger for ${periodName}.\n\nTotal Income: ${monthlyIncome}\nTotal Expenses: ${monthlyExpenses}\nNet Savings: ${monthlySavings}\nSavings Rate: ${savingsRate.toFixed(1)}%`,
      html: generateStatementEmailTemplate({
        userName: user.name,
        periodName,
        metrics: {
          monthlyIncome,
          monthlyExpenses,
          monthlySavings,
          savingsRate,
        },
        currency: user.currency || 'INR',
      }),
      attachments: [
        {
          filename: `SpendWise_Financial_Statement_${year}_${String(month).padStart(2, '0')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: `SpendWise_Transactions_${year}_${String(month).padStart(2, '0')}.csv`,
          content: Buffer.from(csvContent, 'utf-8'),
          contentType: 'text/csv',
        },
      ],
    });

    console.log(`✅ Automated month-end statement dispatched to ${user.email} (${periodName})`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Failed to dispatch statement to ${user.email}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Initialize month-end automated statement cron job
 * Runs at 00:05 AM on the 1st day of every month ('5 0 1 * *')
 */
export const initMonthEndCron = () => {
  cron.schedule('5 0 1 * *', async () => {
    console.log('⏰ Triggering automated month-end financial statement cron job...');

    const now = new Date();
    // Previous month calculation
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = prevMonthDate.getMonth() + 1;
    const year = prevMonthDate.getFullYear();

    try {
      const users = await User.find({});
      console.log(`Processing automated statements for ${users.length} users for month ${month}/${year}...`);

      for (const user of users) {
        await dispatchStatementForUser(user, month, year);
      }

      console.log('🏁 Month-end statement dispatch cycle complete.');
    } catch (err) {
      console.error('Error in month-end statement cron cycle:', err);
    }
  });

  console.log('📅 Automated Month-End Financial Statement Cron Job Scheduled (Runs 1st of every month at 00:05 AM)');
};
