import React from 'react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const TransactionDrawer = ({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-background/30 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-surface-container-lowest shadow-2xl z-50 flex flex-col border-l border-[#ECECEC] animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-space-lg py-space-md bg-surface-container-low/70 border-b border-[#ECECEC]">
          <div className="flex items-center gap-2">
            <span className="font-mono-num-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Record Details
            </span>
            <span
              className={`px-2 py-0.5 rounded text-label-sm font-label-sm font-medium ${
                isIncome
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {isIncome ? 'Income Inflow' : 'Expense Outflow'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Edit Transaction"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Close"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-space-lg py-space-md flex flex-col gap-space-lg">
          {/* Merchant / Title */}
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-medium">
              Merchant / Title
            </span>
            <h3 className="font-headline-lg text-headline-lg text-on-surface leading-tight font-semibold">
              {transaction.title}
            </h3>
          </div>

          {/* Hero Amount Display */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-[#ECECEC] flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-medium">
              Total Value
            </span>
            <div
              className={`font-mono-num-lg text-mono-num-lg font-bold tabular-nums ${
                isIncome ? 'text-tertiary' : 'text-on-surface'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="flex flex-col gap-space-sm text-body-sm">
            <div className="flex items-center justify-between py-2 border-b border-surface-container">
              <span className="text-on-surface-variant font-label-md text-label-md">Category</span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-medium text-label-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">
                  {transaction.categoryId?.icon || 'category'}
                </span>
                <span>{transaction.categoryId?.name || 'General'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-surface-container">
              <span className="text-on-surface-variant font-label-md text-label-md">Timestamp</span>
              <span className="font-mono-num-sm text-on-surface">
                {formatDateTime(transaction.transactionDate)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-surface-container">
              <span className="text-on-surface-variant font-label-md text-label-md">Payment Method</span>
              <span className="text-on-surface font-medium">
                {transaction.paymentMethod || 'UPI / QR'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-surface-container">
              <span className="text-on-surface-variant font-label-md text-label-md">Status</span>
              <span className="flex items-center gap-1 text-tertiary font-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Settled & Reconciled
              </span>
            </div>
          </div>

          {/* Notes Field */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-medium">
              Internal Notes
            </span>
            <div className="p-3 rounded-lg bg-surface-container-low border border-[#ECECEC] text-on-surface font-body-sm leading-relaxed min-h-[50px]">
              {transaction.notes || 'No annotations provided for this transaction.'}
            </div>
          </div>

          {/* Receipt Preview Card */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-medium">
              Attachment
            </span>
            <div className="p-3 rounded-lg bg-surface-container-low border border-[#ECECEC] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[22px]">receipt</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-medium truncate">
                    {transaction.receiptName || 'digital_receipt_verified.pdf'}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">184 KB • Cloud Stored</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-space-lg py-space-md bg-surface-container-low/70 border-t border-[#ECECEC] flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(transaction);
              onClose();
            }}
            className="flex items-center gap-1 text-error font-label-md text-label-md hover:underline cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            <span>Delete Record</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            type="button"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
};

export default TransactionDrawer;
