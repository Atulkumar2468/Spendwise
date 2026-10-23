import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';

// @desc    Get all transactions with search, filters, sorting, and pagination
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
  try {
    const {
      search,
      type,
      categoryId,
      paymentMethod,
      startDate,
      endDate,
      sortBy = 'transactionDate',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = { userId: req.user._id };

    // Search by title or notes
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { notes: searchRegex }];
    }

    // Filter by type
    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    // Filter by category
    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    // Sorting
    const sortOptions = {};
    const sortField =
      sortBy === 'amount'
        ? 'amount'
        : sortBy === 'title'
        ? 'title'
        : 'transactionDate';
    const sortOrder = order === 'asc' ? 1 : -1;
    sortOptions[sortField] = sortOrder;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const totalRecords = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .populate('categoryId', 'name icon color type')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: transactions.length,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('categoryId', 'name icon color type');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res, next) => {
  try {
    const {
      title,
      amount,
      type,
      categoryId,
      transactionDate,
      paymentMethod,
      notes,
      receiptName,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction title is required.',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number.',
      });
    }

    const transactionType = type === 'income' ? 'income' : 'expense';

    // Verify category exists and belongs to this user
    let category = null;
    if (categoryId) {
      category = await Category.findOne({
        _id: categoryId,
        userId: req.user._id,
      });
    }

    if (!category) {
      // Find fallback category matching type
      category = await Category.findOne({
        userId: req.user._id,
        type: transactionType,
      });
      if (!category) {
        category = await Category.create({
          userId: req.user._id,
          name: transactionType === 'income' ? 'Other Income' : 'Other',
          type: transactionType,
          icon: 'category',
          isDefault: true,
        });
      }
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      title: title.trim(),
      amount: numericAmount,
      type: transactionType,
      categoryId: category._id,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      paymentMethod: paymentMethod || 'UPI / QR',
      notes: notes ? notes.trim() : '',
      receiptName: receiptName || '',
    });

    const populated = await Transaction.findById(transaction._id).populate(
      'categoryId',
      'name icon color type'
    );

    res.status(201).json({
      success: true,
      transaction: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an existing transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied.',
      });
    }

    const {
      title,
      amount,
      type,
      categoryId,
      transactionDate,
      paymentMethod,
      notes,
      receiptName,
    } = req.body;

    if (title && title.trim()) transaction.title = title.trim();

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number.',
        });
      }
      transaction.amount = numericAmount;
    }

    if (type && (type === 'income' || type === 'expense')) {
      transaction.type = type;
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user._id,
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Selected category does not exist.',
        });
      }
      transaction.categoryId = category._id;
    }

    if (transactionDate) transaction.transactionDate = new Date(transactionDate);
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (notes !== undefined) transaction.notes = notes.trim();
    if (receiptName !== undefined) transaction.receiptName = receiptName;

    await transaction.save();

    const populated = await Transaction.findById(transaction._id).populate(
      'categoryId',
      'name icon color type'
    );

    res.status(200).json({
      success: true,
      transaction: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied.',
      });
    }

    await Transaction.deleteOne({ _id: transaction._id });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk import transactions from CSV / Bank Statement
// @route   POST /api/transactions/import
// @access  Private
export const importTransactions = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of transactions to import.',
      });
    }

    if (items.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 500 transactions can be imported in a single batch.',
      });
    }

    // Fetch user categories to match by name or fallback to defaults
    const userCategories = await Category.find({ userId: req.user._id });
    const defaultExpenseCat =
      userCategories.find((c) => c.name.toLowerCase() === 'other' && c.type === 'expense') ||
      userCategories.find((c) => c.type === 'expense') ||
      userCategories[0];

    const defaultIncomeCat =
      userCategories.find((c) => c.name.toLowerCase() === 'other income' && c.type === 'income') ||
      userCategories.find((c) => c.type === 'income') ||
      userCategories[0];

    const categoryMap = new Map();
    userCategories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase(), cat);
    });

    const preparedTransactions = [];

    for (const item of items) {
      const type = (item.type || 'expense').toLowerCase() === 'income' ? 'income' : 'expense';
      const amount = Math.abs(parseFloat(item.amount) || 0);

      if (amount <= 0) continue; // Skip zero or invalid amounts

      let categoryId = item.categoryId;
      if (!categoryId && item.categoryName) {
        const found = categoryMap.get(item.categoryName.toLowerCase());
        if (found) categoryId = found._id;
      }

      if (!categoryId) {
        categoryId = type === 'income' ? defaultIncomeCat?._id : defaultExpenseCat?._id;
      }

      // Safe date parsing
      let parsedDate = new Date();
      if (item.transactionDate) {
        const d = new Date(item.transactionDate);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      preparedTransactions.push({
        userId: req.user._id,
        title: (item.title || item.description || 'Imported Transaction').trim().substring(0, 150),
        amount,
        type,
        categoryId,
        paymentMethod: item.paymentMethod || 'Other',
        transactionDate: parsedDate,
        notes: (item.notes || 'Imported via Bank Statement CSV').substring(0, 500),
      });
    }

    if (preparedTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid transactions found to import. Check dates and positive amounts.',
      });
    }

    const inserted = await Transaction.insertMany(preparedTransactions);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} transactions.`,
      count: inserted.length,
    });
  } catch (err) {
    next(err);
  }
};
