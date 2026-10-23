import React from 'react';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden flex flex-col border border-[#ECECEC] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">delete_forever</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {title}
            </h3>
            <span className="text-label-sm text-on-surface-variant font-medium">Permanent deletion</span>
          </div>
        </div>

        <p className="text-body-sm text-on-surface-variant mb-5 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-error hover:bg-error/90 text-on-error font-headline-sm text-label-md transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
