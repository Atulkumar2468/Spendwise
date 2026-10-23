import React, { useState, useEffect } from 'react';
import API from '../services/api';

export const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit = null,
  initialType = 'expense',
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR');
  const [notes, setNotes] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (transactionToEdit) {
        setTitle(transactionToEdit.title || '');
        setAmount(transactionToEdit.amount ? transactionToEdit.amount.toString() : '');
        setType(transactionToEdit.type || 'expense');
        setCategoryId(
          transactionToEdit.categoryId?._id || transactionToEdit.categoryId || ''
        );
        const d = transactionToEdit.transactionDate
          ? new Date(transactionToEdit.transactionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        setTransactionDate(d);
        setPaymentMethod(transactionToEdit.paymentMethod || 'UPI / QR');
        setNotes(transactionToEdit.notes || '');
        setReceiptName(transactionToEdit.receiptName || '');
      } else {
        // Reset form for new transaction
        setTitle('');
        setAmount('');
        setType(initialType);
        setCategoryId('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI / QR');
        setNotes('');
        setReceiptName('');
      }
      setError('');
    }
  }, [isOpen, transactionToEdit, initialType]);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err.message);
    }
  };

  // Filter categories matching active type (expense or income)
  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category if none selected or type switched
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const exists = filteredCategories.some((c) => c._id === categoryId);
      if (!exists) {
        setCategoryId(filteredCategories[0]._id);
      }
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title or merchant name.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        amount: numAmount,
        type,
        categoryId: categoryId || undefined,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        paymentMethod,
        notes: notes.trim(),
        receiptName: receiptName || undefined,
      };

      if (transactionToEdit && transactionToEdit._id) {
        await API.put(`/transactions/${transactionToEdit._id}`, payload);
      } else {
        await API.post('/transactions', payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to save transaction.'
      );
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodsList = [
    'UPI / QR',
    'HDFC Card',
    'ICICI Bank',
    'Cash',
    'Credit Card',
    'Net Banking',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden flex flex-col border border-[#ECECEC] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-space-lg py-space-md border-b border-[#F0F0F0] bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              {transactionToEdit ? 'edit_note' : 'add_circle'}
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {transactionToEdit ? 'Edit Transaction' : 'Record New Transaction'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-space-lg flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Segmented Type Toggle (Expense vs Income) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Transaction Flow
            </label>
            <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl border border-[#ECECEC]">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-lg text-label-md font-label-md transition-all flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-error">trending_down</span>
                <span>Expense Outflow</span>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-lg text-label-md font-label-md transition-all flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-tertiary">trending_up</span>
                <span>Income Inflow</span>
              </button>
            </div>
          </div>

          {/* Amount and Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Amount (₹)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-secondary font-mono-num-md font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-mono-num-md outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Merchant / Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Swiggy, Salary, Rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none appearance-none focus:bg-surface-container-lowest focus:border-primary cursor-pointer pr-8"
                >
                  {filteredCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-outline pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Date
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Payment Account / Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-label-sm">
              {paymentMethodsList.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`p-2 rounded-lg text-center truncate border transition-all text-xs font-medium ${
                    paymentMethod === pm
                      ? 'bg-surface-container text-on-surface border-primary font-semibold shadow-xs'
                      : 'bg-surface-container-low border-[#ECECEC] text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Notes & Annotations
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes, reimbursement tags, or merchant details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Receipt Attachment Simulation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Receipt Attachment
            </label>
            <div
              onClick={() => {
                const name = `receipt_${Date.now().toString().slice(-4)}.pdf`;
                setReceiptName(receiptName ? '' : name);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container-low border border-dashed border-[#D5D5D5] hover:bg-surface-container transition-colors cursor-pointer text-center"
            >
              <span className="material-symbols-outlined text-[22px] text-outline mb-0.5">
                {receiptName ? 'check_circle' : 'cloud_upload'}
              </span>
              <p className="font-body-sm text-on-surface text-xs font-medium">
                {receiptName ? `Attached: ${receiptName} (Click to remove)` : 'Click to attach receipt image or PDF'}
              </p>
              <p className="font-label-sm text-outline text-[11px]">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <span>{transactionToEdit ? 'Update Transaction' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
