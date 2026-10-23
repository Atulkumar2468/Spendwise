import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required for budget envelope'],
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Month is required (1-12)'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be realistic'],
      max: [2100, 'Year must be realistic'],
    },
    limitAmount: {
      type: Number,
      required: [true, 'Limit amount is required'],
      min: [1, 'Limit amount must be at least ₹1'],
    },
  },
  {
    timestamps: true,
  }
);

// One budget per category per month per user
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
