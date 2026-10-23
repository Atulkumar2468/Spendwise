import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const DashboardPage = ({ onOpenAddModal }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/analytics/summary?month=${month}&year=${year}`);
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [month, year]);

  const metrics = data?.metrics || {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    savingsRate: 0,
  };

  const categoryBreakdown = data?.categoryBreakdown || [];
  const recentTransactions = data?.recentTransactions || [];

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Banner / Notion Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#ECECEC]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-on-surface flex items-center justify-center text-surface-container-lowest shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <span className="font-label-sm text-label-sm text-outline tracking-[0.2em] uppercase font-semibold">
              EXPENSE TRACKER
            </span>
          </div>
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              {user?.name ? `Welcome back, ${user.name}` : 'Expense Tracker'}
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Personal financial ledger & monthly velocity
            </p>
          </div>
        </div>

        {/* Month Selector & Quick Header Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Calendar Month Dropdown */}
          <div className="flex items-center bg-surface-container-low border border-[#ECECEC] rounded-lg px-2.5 py-1.5 gap-2">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              calendar_month
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-on-surface font-body-sm outline-none cursor-pointer text-xs sm:text-sm font-medium"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center gap-1.5 bg-surface-container-lowest border border-[#ECECEC] text-on-surface px-3 py-1.5 rounded-lg font-headline-sm text-label-md shadow-xs hover:bg-surface-container-low transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-error">arrow_upward</span>
            <span>Add Expense</span>
          </button>

          <button
            onClick={() => onOpenAddModal('income')}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-lg font-headline-sm text-label-md shadow-xs hover:bg-tertiary transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* 4 Notion-Style Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] shadow-xs flex flex-col justify-between hover:border-[#D5D5D5] transition-all">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              TOTAL BALANCE
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">savings</span>
          </div>
          <div className="my-2">
            <span
              className={`font-mono-num-lg text-mono-num-lg font-bold tracking-tight ${
                metrics.totalBalance < 0 ? 'text-error' : 'text-on-surface'
              }`}
            >
              {formatCurrency(metrics.totalBalance)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span>All-time accumulated net balance</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] shadow-xs flex flex-col justify-between hover:border-[#D5D5D5] transition-all">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              MONTHLY INCOME
            </span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">trending_up</span>
          </div>
          <div className="my-2">
            <span className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold tracking-tight">
              {formatCurrency(metrics.monthlyIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-tertiary font-semibold">
            <span className="material-symbols-outlined text-[14px]">north_east</span>
            <span>Inflow for selected month</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] shadow-xs flex flex-col justify-between hover:border-[#D5D5D5] transition-all">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              MONTHLY EXPENSES
            </span>
            <span className="material-symbols-outlined text-[18px] text-error">trending_down</span>
          </div>
          <div className="my-2">
            <span className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold tracking-tight">
              {formatCurrency(metrics.monthlyExpenses)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
            <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono-num-sm text-on-surface-variant font-medium">
              {metrics.monthlyIncome > 0
                ? `${Math.round((metrics.monthlyExpenses / metrics.monthlyIncome) * 100)}% of income`
                : 'Ledger debits'}
            </span>
          </div>
        </div>

        {/* Monthly Savings */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] shadow-xs flex flex-col justify-between hover:border-[#D5D5D5] transition-all">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              MONTHLY SAVINGS
            </span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">pie_chart</span>
          </div>
          <div className="my-2">
            <span
              className={`font-mono-num-lg text-mono-num-lg font-bold tracking-tight ${
                metrics.monthlySavings < 0 ? 'text-error' : 'text-on-surface'
              }`}
            >
              {formatCurrency(metrics.monthlySavings)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold tracking-tight">
              {metrics.savingsRate}% savings rate
            </span>
          </div>
        </div>
      </div>

      {/* Notion-Style Dual Workspace Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ALL THE MONEY I'VE SPENT */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-[#ECECEC] shadow-xs flex flex-col overflow-hidden">
          {/* Section Header Ribbon */}
          <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">payments</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-on-surface">
                ALL THE MONEY I'VE SPENT
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">
              Category Distribution
            </span>
          </div>

          {/* Category Cards List */}
          <div className="p-4 flex flex-col gap-2.5">
            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-outline">receipt_long</span>
                <p className="text-body-sm font-medium">No recorded expenses for this month.</p>
                <button
                  onClick={() => onOpenAddModal('expense')}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  + Add First Expense
                </button>
              </div>
            ) : (
              categoryBreakdown.map((cat) => (
                <div
                  key={cat.categoryId}
                  onClick={() => navigate(`/transactions?categoryId=${cat.categoryId}`)}
                  className="category-card p-3 rounded-lg border border-[#EAEAEA] bg-surface-container-lowest hover:bg-[#FAFAFA] flex flex-col gap-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-white"
                        style={{ backgroundColor: cat.color || '#2e614a' }}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {cat.icon || 'category'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-sm font-semibold text-on-surface truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {cat.count} transaction{cat.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono-num-md font-bold text-on-surface">
                        {formatCurrency(cat.amount)}
                      </span>
                      <div className="text-[11px] text-outline font-medium">
                        {cat.percentage}% of total
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: cat.color || '#2e614a',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY / LEDGER */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-[#ECECEC] shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">receipt_long</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-on-surface">
                RECENT ACTIVITY / LEDGER
              </span>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left notion-table border-collapse">
              <thead>
                <tr className="bg-surface-container-low/60 h-9 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-[#ECECEC]">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 min-w-[160px]">Merchant / Title</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-4 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDED] text-body-sm text-on-surface">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      No recent transactions found. Click "Add Transaction" to start recording.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr
                      key={tx._id}
                      onClick={() => navigate(`/transactions?id=${tx._id}`)}
                      className="hover:bg-surface-container-low cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 font-mono-num-sm text-on-surface-variant whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-on-surface truncate max-w-[200px]">
                        {tx.title}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-medium inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            {tx.categoryId?.icon || 'category'}
                          </span>
                          <span>{tx.categoryId?.name || 'General'}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono-num-md font-semibold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-tertiary' : 'text-on-surface'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
