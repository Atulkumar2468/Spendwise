import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Category from './models/Category.js';
import Budget from './models/Budget.js';

dotenv.config();

async function cleanDemoData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const demoUser = await User.findOne({ email: 'alex@spendwise.dev' });
    if (!demoUser) {
      console.log('No demo user (alex@spendwise.dev) found in database.');
      process.exit(0);
    }

    console.log(`Found demo user: ${demoUser.name} (${demoUser._id})`);

    const deletedTransactions = await Transaction.deleteMany({ userId: demoUser._id });
    console.log(`Deleted ${deletedTransactions.deletedCount} demo transactions.`);

    const deletedBudgets = await Budget.deleteMany({ userId: demoUser._id });
    console.log(`Deleted ${deletedBudgets.deletedCount} demo budgets.`);

    const deletedCategories = await Category.deleteMany({ userId: demoUser._id });
    console.log(`Deleted ${deletedCategories.deletedCount} demo categories.`);

    await User.findByIdAndDelete(demoUser._id);
    console.log(`Successfully deleted demo user alex@spendwise.dev.`);

    console.log('Database is now clean of demo account data!');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning demo data:', err);
    process.exit(1);
  }
}

cleanDemoData();
