import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

// @desc    Get all budgets for a specific month and year with actual spend calculations
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-12
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    // Find all budgets for this user in month/year
    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    })
      .populate('categoryId', 'name icon color type')
      .lean();

    // Date range for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Aggregate actual expenses per category for this month
    const expenseAggregation = await Transaction.aggregate([
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
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const spendMap = new Map();
    expenseAggregation.forEach((item) => {
      spendMap.set(item._id.toString(), {
        totalSpent: item.totalSpent,
        transactionCount: item.transactionCount,
      });
    });

    let totalBudgeted = 0;
    let totalSpent = 0;
    let envelopesExceeded = 0;

    const enrichedBudgets = budgets.map((b) => {
      const catId = b.categoryId?._id ? b.categoryId._id.toString() : b.categoryId?.toString();
      const stats = spendMap.get(catId) || { totalSpent: 0, transactionCount: 0 };
      const spent = stats.totalSpent;
      const remaining = b.limitAmount - spent;
      const percentUsed = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      const isOverspent = spent > b.limitAmount;

      totalBudgeted += b.limitAmount;
      totalSpent += spent;
      if (isOverspent) envelopesExceeded++;

      return {
        ...b,
        spent,
        remaining,
        percentUsed: Math.min(Math.round(percentUsed * 10) / 10, 999),
        isOverspent,
        transactionCount: stats.transactionCount,
      };
    });

    const user = await User.findById(req.user._id);
    const monthlyCap = user?.monthlyBudget || 60000;
    const unallocated = Math.max(0, monthlyCap - totalBudgeted);

    res.status(200).json({
      success: true,
      month,
      year,
      summary: {
        monthlyCap,
        totalBudgeted,
        totalSpent,
        unallocated,
        envelopesExceeded,
        envelopeCount: enrichedBudgets.length,
        utilizationRate:
          monthlyCap > 0 ? Math.round((totalBudgeted / monthlyCap) * 1000) / 10 : 0,
      },
      budgets: enrichedBudgets,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a category budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res, next) => {
  try {
    const { categoryId, month, year, limitAmount } = req.body;

    if (!categoryId || !limitAmount) {
      return res.status(400).json({
        success: false,
        message: 'Category and limit amount are required.',
      });
    }

    const now = new Date();
    const budgetMonth = parseInt(month, 10) || now.getMonth() + 1;
    const budgetYear = parseInt(year, 10) || now.getFullYear();
    const numericLimit = Number(limitAmount);

    if (isNaN(numericLimit) || numericLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Limit amount must be a positive number.',
      });
    }

    // Verify category belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or access denied.',
      });
    }

    // Upsert or check existing
    let budget = await Budget.findOne({
      userId: req.user._id,
      categoryId,
      month: budgetMonth,
      year: budgetYear,
    });

    if (budget) {
      budget.limitAmount = numericLimit;
      await budget.save();
    } else {
      budget = await Budget.create({
        userId: req.user._id,
        categoryId,
        month: budgetMonth,
        year: budgetYear,
        limitAmount: numericLimit,
      });
    }

    const populated = await Budget.findById(budget._id).populate(
      'categoryId',
      'name icon color type'
    );

    res.status(201).json({
      success: true,
      budget: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget envelope not found or access denied.',
      });
    }

    const { limitAmount } = req.body;
    if (limitAmount !== undefined) {
      const numericLimit = Number(limitAmount);
      if (isNaN(numericLimit) || numericLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Limit amount must be a positive number.',
        });
      }
      budget.limitAmount = numericLimit;
    }

    await budget.save();

    const populated = await Budget.findById(budget._id).populate(
      'categoryId',
      'name icon color type'
    );

    res.status(200).json({
      success: true,
      budget: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget envelope not found or access denied.',
      });
    }

    await Budget.deleteOne({ _id: budget._id });

    res.status(200).json({
      success: true,
      message: 'Budget envelope deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
