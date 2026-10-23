import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

// @desc    Get all categories for authenticated user
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { userId: req.user._id };

    if (type && (type === 'income' || type === 'expense')) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean();

    // Calculate total spend and transaction count for each category
    const stats = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = new Map();
    stats.forEach((s) => {
      statsMap.set(s._id.toString(), {
        totalAmount: s.totalAmount,
        transactionCount: s.transactionCount,
      });
    });

    const categoriesWithStats = categories.map((cat) => {
      const catStat = statsMap.get(cat._id.toString()) || {
        totalAmount: 0,
        transactionCount: 0,
      };
      return {
        ...cat,
        totalAmount: catStat.totalAmount,
        transactionCount: catStat.transactionCount,
      };
    });

    res.status(200).json({
      success: true,
      count: categoriesWithStats.length,
      categories: categoriesWithStats,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const trimmedName = name.trim();
    const categoryType = type === 'income' ? 'income' : 'expense';

    // Check for duplicate category name for this user (case-insensitive)
    const existing = await Category.findOne({
      userId: req.user._id,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      type: categoryType,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${trimmedName}" (${categoryType}) already exists.`,
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: trimmedName,
      type: categoryType,
      icon: icon || (categoryType === 'income' ? 'savings' : 'category'),
      color: color || (categoryType === 'income' ? '#059669' : '#2e614a'),
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or access denied.',
      });
    }

    const { name, icon, color } = req.body;

    if (name && name.trim()) {
      const trimmedName = name.trim();
      // Check duplicate
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        userId: req.user._id,
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        type: category.type,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Category "${trimmedName}" (${category.type}) already exists.`,
        });
      }
      category.name = trimmedName;
    }

    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.status(200).json({
      success: true,
      category,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category safely
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or access denied.',
      });
    }

    // Check if there are attached transactions
    const transactionCount = await Transaction.countDocuments({
      categoryId: category._id,
      userId: req.user._id,
    });

    if (transactionCount > 0) {
      // Find fallback "Other" category for this user
      let fallbackCat = await Category.findOne({
        userId: req.user._id,
        type: category.type,
        name: category.type === 'income' ? 'Other Income' : 'Other',
      });

      if (!fallbackCat) {
        fallbackCat = await Category.create({
          userId: req.user._id,
          name: category.type === 'income' ? 'Other Income' : 'Other',
          type: category.type,
          icon: 'more_horiz',
          color: '#64748b',
          isDefault: true,
        });
      }

      // Reassign transactions to fallback category
      await Transaction.updateMany(
        { categoryId: category._id, userId: req.user._id },
        { $set: { categoryId: fallbackCat._id } }
      );
    }

    // Remove any budget for this category
    await Budget.deleteMany({
      categoryId: category._id,
      userId: req.user._id,
    });

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      message: `Category deleted safely. ${
        transactionCount > 0
          ? `${transactionCount} transactions were reassigned to 'Other'.`
          : ''
      }`,
    });
  } catch (err) {
    next(err);
  }
};
