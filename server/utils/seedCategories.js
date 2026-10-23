import Category from '../models/Category.js';

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: 'restaurant', color: '#c2410c' },
  { name: 'Transportation', type: 'expense', icon: 'directions_car', color: '#0284c7' },
  { name: 'Shopping', type: 'expense', icon: 'shopping_bag', color: '#7c3aed' },
  { name: 'Education', type: 'expense', icon: 'school', color: '#0891b2' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'bolt', color: '#d97706' },
  { name: 'Healthcare', type: 'expense', icon: 'medical_services', color: '#e11d48' },
  { name: 'Entertainment', type: 'expense', icon: 'movie', color: '#9333ea' },
  { name: 'Rent & Housing', type: 'expense', icon: 'home', color: '#2563eb' },
  { name: 'Insurance', type: 'expense', icon: 'shield', color: '#475569' },
  { name: 'Gym & Fitness', type: 'expense', icon: 'fitness_center', color: '#16a34a' },
  { name: 'Other', type: 'expense', icon: 'more_horiz', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'account_balance_wallet', color: '#059669' },
  { name: 'Freelance', type: 'income', icon: 'laptop_mac', color: '#0d9488' },
  { name: 'Investment', type: 'income', icon: 'trending_up', color: '#16a34a' },
  { name: 'Business', type: 'income', icon: 'storefront', color: '#2563eb' },
  { name: 'Other Income', type: 'income', icon: 'savings', color: '#4b5563' },
];

export const seedUserCategories = async (userId) => {
  try {
    const existingCount = await Category.countDocuments({ userId });
    if (existingCount > 0) {
      return; // Already seeded
    }

    const categoriesToInsert = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
        ...cat,
        userId,
        isDefault: true,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({
        ...cat,
        userId,
        isDefault: true,
      })),
    ];

    await Category.insertMany(categoriesToInsert, { ordered: false });
    console.log(`Seeded ${categoriesToInsert.length} categories for user ${userId}`);
  } catch (err) {
    console.error(`Error seeding categories for user ${userId}:`, err.message);
  }
};
