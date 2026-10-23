import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import {
  generateMonthlyPdfBuffer,
  generateMonthlyCsvString,
} from '../utils/generatePdfStatement.js';
import {
  sendEmail,
  generateStatementEmailTemplate,
} from '../utils/sendEmail.js';

// @desc    Get dashboard financial summary and key metrics
// @route   GET /api/analytics/summary
// @access  Private
export const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-12
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. All-time income and expenses for Total Balance
    const allTimeTotals = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let allTimeIncome = 0;
    let allTimeExpenses = 0;
    allTimeTotals.forEach((t) => {
      if (t._id === 'income') allTimeIncome = t.total;
      if (t._id === 'expense') allTimeExpenses = t.total;
    });
    const totalBalance = allTimeIncome - allTimeExpenses;

    // 2. Selected Month income and expenses
    const monthlyTotals = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let monthlyTransactionCount = 0;

    monthlyTotals.forEach((t) => {
      if (t._id === 'income') monthlyIncome = t.total;
      if (t._id === 'expense') monthlyExpenses = t.total;
      monthlyTransactionCount += t.count;
    });

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate =
      monthlyIncome > 0
        ? Math.round((monthlySavings / monthlyIncome) * 1000) / 10
        : 0;

    // 3. Category spending breakdown for this month
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Populate categories
    const categories = await Category.find({ userId: req.user._id }).lean();
    const catMap = new Map();
    categories.forEach((c) => catMap.set(c._id.toString(), c));

    const categoryBreakdown = categorySpending.map((cs) => {
      const cat = catMap.get(cs._id.toString()) || {
        name: 'Uncategorized',
        icon: 'more_horiz',
        color: '#64748b',
      };
      const percentage =
        monthlyExpenses > 0
          ? Math.round((cs.total / monthlyExpenses) * 1000) / 10
          : 0;
      return {
        categoryId: cs._id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: cs.total,
        percentage,
        count: cs.count,
      };
    });

    // 4. Recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .populate('categoryId', 'name icon color type')
      .sort({ transactionDate: -1 })
      .limit(8)
      .lean();

    res.status(200).json({
      success: true,
      month,
      year,
      metrics: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
        allTimeIncome,
        allTimeExpenses,
        transactionCount: monthlyTransactionCount,
      },
      categoryBreakdown,
      recentTransactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get 6-month historical cash-flow data for Recharts
// @route   GET /api/analytics/monthly
// @access  Private
export const getMonthlyHistory = async (req, res, next) => {
  try {
    const monthsBack = 6;
    const history = [];
    const now = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);

      const monthName = start.toLocaleString('en-US', { month: 'short' });
      const label = `${monthName} ${y}`;

      const agg = await Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            transactionDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      let income = 0;
      let expenses = 0;
      agg.forEach((a) => {
        if (a._id === 'income') income = a.total;
        if (a._id === 'expense') expenses = a.total;
      });

      const savings = income - expenses;

      history.push({
        month: m,
        year: y,
        label,
        monthName,
        income,
        expenses,
        savings,
      });
    }

    res.status(200).json({
      success: true,
      history,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed category distribution, top outflow category, and average daily spend
// @route   GET /api/analytics/categories
// @access  Private
export const getCategoryAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInMonth = endOfMonth.getDate();

    // Total expense for the month
    const expenseTotals = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = expenseTotals.reduce((acc, curr) => acc + curr.total, 0);

    // Categories lookup
    const allCategories = await Category.find({ userId: req.user._id }).lean();
    const catMap = new Map();
    allCategories.forEach((c) => catMap.set(c._id.toString(), c));

    const distribution = expenseTotals.map((item) => {
      const cat = catMap.get(item._id.toString()) || {
        name: 'Uncategorized',
        icon: 'more_horiz',
        color: '#64748b',
      };
      const percentage =
        totalExpense > 0
          ? Math.round((item.total / totalExpense) * 1000) / 10
          : 0;

      return {
        categoryId: item._id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: item.total,
        percentage,
        count: item.count,
      };
    });

    const topCategory =
      distribution.length > 0
        ? distribution[0]
        : { name: 'None', amount: 0, percentage: 0 };

    // Average daily spending
    const today = new Date();
    const isCurrentMonth =
      today.getMonth() + 1 === month && today.getFullYear() === year;
    const daysPassed = isCurrentMonth
      ? Math.max(1, today.getDate())
      : daysInMonth;
    const averageDailySpend =
      daysPassed > 0 ? Math.round(totalExpense / daysPassed) : 0;

    res.status(200).json({
      success: true,
      month,
      year,
      totalExpense,
      topCategory,
      averageDailySpend,
      distribution,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download official PDF monthly financial statement
// @route   GET /api/analytics/statement/pdf
// @access  Private
export const downloadPdfStatement = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('categoryId', 'name icon color type')
      .sort({ transactionDate: -1 });

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

    const user = await User.findById(req.user._id);

    const pdfBuffer = await generateMonthlyPdfBuffer({
      user: user || req.user,
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

    const filename = `SpendWise_Statement_${year}_${String(month).padStart(2, '0')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Email monthly financial statement (PDF + CSV ledger) to user
// @route   POST /api/analytics/statement/email
// @access  Private
export const emailMonthlyStatement = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.body.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.body.year, 10) || now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('categoryId', 'name icon color type')
      .sort({ transactionDate: -1 });

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

    const user = await User.findById(req.user._id);
    const targetUser = user || req.user;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const periodName = `${monthNames[month - 1]} ${year}`;

    // 1. Generate PDF Statement
    const pdfBuffer = await generateMonthlyPdfBuffer({
      user: targetUser,
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
    const csvContent = generateMonthlyCsvString(transactions, targetUser.currency || 'INR');

    // 3. Dispatch Email with attachments
    await sendEmail({
      to: targetUser.email,
      subject: `SpendWise: Monthly Financial Statement for ${periodName}`,
      text: `Hello ${targetUser.name},\n\nPlease find attached your SpendWise monthly statement and CSV ledger for ${periodName}.\n\nTotal Income: ${monthlyIncome}\nTotal Expenses: ${monthlyExpenses}\nNet Savings: ${monthlySavings}\nSavings Rate: ${savingsRate.toFixed(1)}%`,
      html: generateStatementEmailTemplate({
        userName: targetUser.name,
        periodName,
        metrics: {
          monthlyIncome,
          monthlyExpenses,
          monthlySavings,
          savingsRate,
        },
        currency: targetUser.currency || 'INR',
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

    res.status(200).json({
      success: true,
      message: `Monthly PDF statement and CSV ledger for ${periodName} delivered to ${targetUser.email}!`,
    });
  } catch (err) {
    next(err);
  }
};
