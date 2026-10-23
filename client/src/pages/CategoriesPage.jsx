import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { formatCurrency } from '../utils/formatters';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'income'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('category');
  const [catColor, setCatColor] = useState('#2e614a');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete modal state
  const [catToDelete, setCatToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await API.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon(activeTab === 'income' ? 'savings' : 'category');
    setCatColor(activeTab === 'income' ? '#059669' : '#2e614a');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setCatName(category.name);
    setCatIcon(category.icon || 'category');
    setCatColor(category.color || '#2e614a');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      setModalError('Category name is required.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (editingCategory) {
        await API.put(`/categories/${editingCategory._id}`, {
          name: catName.trim(),
          icon: catIcon,
          color: catColor,
        });
      } else {
        await API.post('/categories', {
          name: catName.trim(),
          type: activeTab,
          icon: catIcon,
          color: catColor,
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.message || 'Failed to save category.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/categories/${catToDelete._id}`);
      setCatToDelete(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const availableIcons = [
    'restaurant',
    'shopping_bag',
    'directions_car',
    'home',
    'medical_services',
    'school',
    'movie',
    'bolt',
    'fitness_center',
    'shield',
    'flight',
    'account_balance_wallet',
    'savings',
    'storefront',
    'laptop_mac',
    'trending_up',
    'more_horiz',
    'category',
  ];

  const availableColors = [
    '#2e614a',
    '#059669',
    '#0284c7',
    '#2563eb',
    '#7c3aed',
    '#9333ea',
    '#c2410c',
    '#d97706',
    '#e11d48',
    '#475569',
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#ECECEC]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">category</span>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              ORGANIZATION & TAXONOMY
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            Financial Categories
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Custom category envelopes, color identifiers, and cumulative ledger spending.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs"
          type="button"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          <span>Create Custom Category</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ECECEC] pb-1">
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'expense'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">trending_down</span>
          <span>Expense Categories ({categories.filter((c) => c.type === 'expense').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'income'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">trending_up</span>
          <span>Income Categories ({categories.filter((c) => c.type === 'income').length})</span>
        </button>
      </div>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-on-surface-variant">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs">Loading categories...</span>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-on-surface-variant">
            No categories defined for {activeTab}.
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className="bg-surface-container-lowest rounded-xl p-4 border border-[#ECECEC] shadow-xs flex flex-col justify-between gap-3 hover:border-[#D5D5D5] transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                    style={{ backgroundColor: cat.color || '#2e614a' }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {cat.icon || 'category'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                      {cat.name}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {cat.isDefault ? 'Standard Default' : 'Custom Category'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                    title="Edit Category"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </button>
                  <button
                    onClick={() => setCatToDelete(cat)}
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                    title="Delete Category"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-2 border-t border-[#F0EDED] flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">
                  {cat.transactionCount || 0} recorded transaction
                  {(cat.transactionCount || 0) !== 1 ? 's' : ''}
                </span>
                <span className="font-mono-num-md font-bold text-on-surface">
                  {formatCurrency(cat.totalAmount || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
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
                {editingCategory ? 'Edit Category' : `New ${activeTab === 'income' ? 'Income' : 'Expense'} Category`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscriptions, Groceries"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Icon Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setCatIcon(ic)}
                      className={`h-9 rounded-lg flex items-center justify-center border transition-all ${
                        catIcon === ic
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-[#ECECEC] bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{ic}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCatColor(col)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        catColor === col ? 'border-on-surface scale-110 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
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
                  <span>{editingCategory ? 'Update' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(catToDelete)}
        onClose={() => setCatToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Category "${catToDelete?.name}"`}
        message="If this category contains transactions, they will automatically and safely be reassigned to the 'Other' category so your financial ledger is never corrupted."
        loading={deleteLoading}
      />
    </div>
  );
};

export default CategoriesPage;
