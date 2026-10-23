import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import TransactionModal from '../components/TransactionModal';
import TransactionDrawer from '../components/TransactionDrawer';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ImportStatementModal from '../components/ImportStatementModal';

export const TransactionsPage = () => {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all'); // 'all', 'expense', 'income'
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || 'all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [sortBy, setSortBy] = useState('transactionDate');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modals and Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [activeDrawerTx, setActiveDrawerTx] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/categories');
        if (res.data?.success) setCategories(res.data.categories || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, []);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        sortBy,
        order,
      });

      if (search.trim()) params.append('search', search.trim());
      if (type !== 'all') params.append('type', type);
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedMethod !== 'all') params.append('paymentMethod', selectedMethod);

      const res = await API.get(`/transactions?${params.toString()}`);
      if (res.data?.success) {
        setTransactions(res.data.transactions || []);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 1);

        // Check if an ID query param was passed from dashboard
        const queryId = searchParams.get('id');
        if (queryId && !activeDrawerTx) {
          const match = res.data.transactions.find((t) => t._id === queryId);
          if (match) setActiveDrawerTx(match);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, type, selectedCategory, selectedMethod, sortBy, order, page]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Title', 'Type', 'Category', 'Account', 'Amount', 'Notes'];
    const rows = transactions.map((t) => [
      new Date(t.transactionDate).toISOString().split('T')[0],
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      `"${t.categoryId?.name || 'Uncategorized'}"`,
      t.paymentMethod,
      t.amount,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SpendWise_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete transaction
  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/transactions/${txToDelete._id}`);
      setTxToDelete(null);
      if (activeDrawerTx?._id === txToDelete._id) setActiveDrawerTx(null);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete transaction.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#ECECEC]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              All Transactions
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono-num-sm text-label-sm font-semibold">
              {totalRecords} records
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Search, filter, audit, and reconcile your personal financial records.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-[#ECECEC] shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Import Statement</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-[#ECECEC] shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {importSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => setImportSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Notion-Style Filter & View Bar */}
      <div className="flex flex-col gap-3 bg-surface-container-low p-3 rounded-xl border border-[#ECECEC]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Type Tabs */}
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg text-label-sm font-label-sm border border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => {
                setType('all');
                setPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                type === 'all'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-surface-container-lowest text-error shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-surface-container-lowest text-tertiary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Income
            </button>
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-[#ECECEC] text-on-surface outline-none cursor-pointer pr-6 font-medium text-xs shadow-xs"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-[#ECECEC] text-on-surface outline-none cursor-pointer pr-6 font-medium text-xs shadow-xs"
              >
                <option value="all">All Payment Accounts</option>
                <option value="UPI / QR">UPI / QR</option>
                <option value="HDFC Card">HDFC Card</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={`${sortBy}-${order}`}
                onChange={(e) => {
                  const [field, ord] = e.target.value.split('-');
                  setSortBy(field);
                  setOrder(ord);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-[#ECECEC] text-on-surface outline-none cursor-pointer pr-6 font-medium text-xs shadow-xs"
              >
                <option value="transactionDate-desc">Date (Newest First)</option>
                <option value="transactionDate-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (Highest First)</option>
                <option value="amount-asc">Amount (Lowest First)</option>
                <option value="title-asc">Merchant A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-[#ECECEC] shadow-xs">
          <span className="material-symbols-outlined text-[18px] text-outline">search</span>
          <input
            type="text"
            placeholder="Search transactions by merchant, notes, or tags..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-on-surface font-body-sm text-body-sm placeholder:text-outline outline-none w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-outline hover:text-on-surface px-1.5 py-0.5 rounded bg-surface-container"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Database Table Container */}
      <div className="w-full bg-surface-container-lowest rounded-xl border border-[#ECECEC] shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left notion-table border-collapse">
            <thead>
              <tr className="bg-surface-container-low h-9 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-[#ECECEC]">
                <th className="px-4 py-2">Date & Time</th>
                <th className="px-4 py-2 min-w-[200px]">Merchant / Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Account / Method</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Amount (₹)</th>
                <th className="w-20 px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y divide-[#F0EDED] text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs">Loading ledger entries...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-outline">
                        search_off
                      </span>
                      <p className="font-medium text-sm">No transactions match your filters.</p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setType('all');
                          setSelectedCategory('all');
                          setSelectedMethod('all');
                        }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    onClick={() => setActiveDrawerTx(tx)}
                    className="hover:bg-surface-container-low/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono-num-sm text-on-surface-variant whitespace-nowrap text-xs">
                      {formatDateTime(tx.transactionDate)}
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface truncate max-w-[240px]">
                      {tx.title}
                      {tx.notes && (
                        <p className="text-[11px] text-outline truncate font-normal mt-0.5">
                          {tx.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-medium inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">
                          {tx.categoryId?.icon || 'category'}
                        </span>
                        <span>{tx.categoryId?.name || 'General'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap font-medium">
                      {tx.paymentMethod}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          tx.type === 'income'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono-num-md font-bold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td
                      className="px-4 py-3 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setTransactionToEdit(tx);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                          title="Edit"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setTxToDelete(tx)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                          title="Delete"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="px-4 py-3 bg-surface-container-low/50 border-t border-[#ECECEC] flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Showing {transactions.length} of {totalRecords} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded bg-surface-container-lowest border border-[#ECECEC] text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all"
              type="button"
            >
              Previous
            </button>
            <span className="px-2 font-mono-num-sm font-semibold">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded bg-surface-container-lowest border border-[#ECECEC] text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={() => {
          fetchTransactions();
        }}
        transactionToEdit={transactionToEdit}
      />

      {/* Transaction Slide-over Drawer */}
      <TransactionDrawer
        isOpen={Boolean(activeDrawerTx)}
        onClose={() => setActiveDrawerTx(null)}
        transaction={activeDrawerTx}
        onEdit={(tx) => {
          setTransactionToEdit(tx);
          setIsModalOpen(true);
        }}
        onDelete={(tx) => setTxToDelete(tx)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${txToDelete?.title}" (${formatCurrency(txToDelete?.amount)})? This will adjust your total balance and monthly totals immediately.`}
        loading={deleteLoading}
      />

      {/* Bank Statement / CSV Import Modal */}
      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(count) => {
          fetchTransactions();
          setImportSuccessMessage(`Successfully imported ${count} transactions into your financial ledger!`);
          setTimeout(() => setImportSuccessMessage(''), 6000);
        }}
        categories={categories}
      />
    </div>
  );
};

export default TransactionsPage;
