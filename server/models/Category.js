import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Category type must be income or expense'],
      default: 'expense',
    },
    icon: {
      type: String,
      default: 'category',
    },
    color: {
      type: String,
      default: '#2e614a',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate categories with the same name and type for a user
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
