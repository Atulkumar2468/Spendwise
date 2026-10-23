import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete modal state
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await API.get('/categories?type=expense');
        if (res.data?.success) setCategories(res.data.categories || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/budgets?month=${month}&year=${year}`);
      if (res.data?.success) {
        setBudgets(res.data.budgets || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const handleOpenCreate = () => {
    setBudgetToEdit(null);
    setSelectedCategory(categories.length > 0 ? categories[0]._id : '');
    setLimitAmount('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setBudgetToEdit(b);
    setSelectedCategory(b.categoryId?._id || b.categoryId);
    setLimitAmount(b.limitAmount?.toString() || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const numLimit = parseFloat(limitAmount);
    if (isNaN(numLimit) || numLimit <= 0) {
      setModalError('Please enter a valid limit amount.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (budgetToEdit) {
        await API.put(`/budgets/${budgetToEdit._id}`, {
          limitAmount: numLimit,
        });
      } else {
        await API.post('/budgets', {
          categoryId: selectedCategory,
          month,
          year,
          limitAmount: numLimit,
        });
      }

      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.message || 'Failed to save budget envelope.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/budgets/${budgetToDelete._id}`);
      setBudgetToDelete(null);
      fetchBudgets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete budget envelope.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
      {/* Banner / Header */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-low p-6 border border-[#ECECEC] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                Fiscal Cycle • {formatMonthYear(month, year)}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono-num-sm">
                Active Envelopes
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Monthly Budgets & Category Envelopes
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Set deterministic category spending caps, monitor velocity pacing, and prevent discretionary overspending.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Month Filter */}
            <div className="flex items-center bg-surface-container-lowest border border-[#ECECEC] rounded-lg px-2.5 py-1.5 gap-2 shadow-xs">
              <span className="material-symbols-outlined text-[17px] text-on-surface-variant">calendar_month</span>
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
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-tertiary transition-colors shadow-xs font-label-md text-label-md font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>Create Category Budget</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Budget Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Cap */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Monthly Cap
            </span>
            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
            </div>
          </div>
          <div className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold tracking-tight">
            {formatCurrency(summary?.monthlyCap || 60000)}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Target envelope allocation
          </span>
        </div>

        {/* Total Allocated */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Allocated
            </span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high font-mono-num-sm text-on-surface font-semibold">
              {summary?.utilizationRate || 0}%
            </span>
          </div>
          <div className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold tracking-tight">
            {formatCurrency(summary?.totalBudgeted || 0)}
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(summary?.utilizationRate || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Unallocated Reserve */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Unallocated Reserve
            </span>
            <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[16px]">savings</span>
            </div>
          </div>
          <div className="font-mono-num-lg text-mono-num-lg text-primary font-bold tracking-tight">
            {formatCurrency(summary?.unallocated || 0)}
          </div>
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Safe Buffer Intact</span>
          </div>
        </div>

        {/* Envelopes Exceeded */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Envelopes Exceeded
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                (summary?.envelopesExceeded || 0) > 0 ? 'bg-error' : 'bg-primary'
              }`}
            />
          </div>
          <div className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold tracking-tight">
            {summary?.envelopesExceeded || 0}{' '}
            <span className="font-body-md text-on-surface-variant font-normal text-sm">
              / {summary?.envelopeCount || 0}
            </span>
          </div>
          <span
            className={`font-label-sm text-xs font-semibold ${
              (summary?.envelopesExceeded || 0) > 0 ? 'text-error' : 'text-primary'
            }`}
          >
            {(summary?.envelopesExceeded || 0) > 0
              ? `${summary.envelopesExceeded} category exceeded limit!`
              : 'All pacing within safe bounds'}
          </span>
        </div>
      </div>

      {/* Category Envelopes Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">dataset</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Active Category Envelopes
            </h2>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono-num-sm font-semibold">
              {budgets.length} envelopes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-on-surface-variant">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs">Loading budget envelopes...</span>
              </div>
            </div>
          ) : budgets.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-surface-container-lowest rounded-xl border border-[#ECECEC] p-8 flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] text-outline">pie_chart</span>
              <p className="font-medium">No category budgets created for this month.</p>
              <button
                onClick={handleOpenCreate}
                className="text-xs text-primary font-semibold hover:underline mt-1"
              >
                + Create First Category Envelope
              </button>
            </div>
          ) : (
            budgets.map((b) => {
              const percent = b.percentUsed || 0;
              const isOver = b.isOverspent;
              const isWarning = percent >= 85 && !isOver;

              let barColor = 'bg-primary';
              if (isOver) barColor = 'bg-error';
              else if (isWarning) barColor = 'bg-amber-500';

              return (
                <div
                  key={b._id}
                  className="bg-surface-container-lowest rounded-xl p-5 border border-[#ECECEC] flex flex-col justify-between gap-4 shadow-xs hover:border-[#D5D5D5] transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                        style={{ backgroundColor: b.categoryId?.color || '#2e614a' }}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {b.categoryId?.icon || 'category'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                            {b.categoryId?.name}
                          </span>
                          <span
                            className={`font-label-sm text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isOver
                                ? 'bg-error-container text-error'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {isOver ? 'EXCEEDED' : isWarning ? 'NEAR CAP' : 'ON TRACK'}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {b.transactionCount || 0} transaction{(b.transactionCount || 0) !== 1 ? 's' : ''} this month
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Edit Envelope Limit"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button
                        onClick={() => setBudgetToDelete(b)}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                        title="Delete Envelope"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Limit vs Actual */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-on-surface font-semibold">
                          {formatCurrency(b.spent)}
                        </span>
                        <span className="text-outline">of</span>
                        <span className="text-secondary font-medium">
                          {formatCurrency(b.limitAmount)}
                        </span>
                      </div>
                      <span className="font-mono-num-sm font-bold text-on-surface">
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span
                        className={`font-semibold ${
                          isOver ? 'text-error' : 'text-on-surface-variant'
                        }`}
                      >
                        {isOver
                          ? `Over limit by ${formatCurrency(Math.abs(b.remaining))}`
                          : `${formatCurrency(b.remaining)} remaining`}
                      </span>
                      <span className="text-outline font-medium">
                        Monthly cap
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create / Edit Envelope Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden flex flex-col border border-[#ECECEC]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0F0F0] bg-surface-container-low/50">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {budgetToEdit ? 'Edit Budget Envelope' : 'New Category Envelope'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 text-xs">
                  {modalError}
                </div>
              )}

              {/* Category Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Expense Category
                </label>
                <select
                  disabled={Boolean(budgetToEdit)}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary disabled:opacity-60 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Limit Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Monthly Limit Amount (₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-secondary font-mono-num-md font-medium">₹</span>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 5000"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-mono-num-md outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {modalLoading && (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  )}
                  <span>{budgetToEdit ? 'Save Changes' : 'Create Envelope'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget Envelope"
        message={`Are you sure you want to remove the budget cap for "${budgetToDelete?.categoryId?.name}"? Your past transactions in this category will remain completely intact.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default BudgetsPage;
