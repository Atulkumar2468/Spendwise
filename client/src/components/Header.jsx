import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Header = ({ onToggleSidebar, onOpenAddModal, title = 'Workspace' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 lg:left-[230px] right-0 h-14 bg-surface-container-lowest/95 backdrop-blur-md z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#ECECEC] shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      {/* Left controls & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
          <span
            onClick={() => navigate('/')}
            className="hover:text-on-surface cursor-pointer transition-colors hidden sm:inline"
          >
            SpendWise
          </span>
          <span className="font-label-sm text-label-sm text-outline-variant hidden sm:inline">/</span>
          <span className="text-on-surface font-headline-sm text-headline-sm font-semibold truncate max-w-[180px] sm:max-w-none">
            {title}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <div
          onClick={() => navigate('/transactions')}
          className="hidden md:flex items-center gap-2 bg-surface-container-low px-2.5 py-1.5 rounded-lg w-48 lg:w-56 text-on-surface-variant cursor-pointer hover:bg-surface-container transition-colors border border-transparent hover:border-[#E0E0E0]"
        >
          <span className="material-symbols-outlined text-[17px]">search</span>
          <span className="text-body-sm text-outline truncate flex-1">Search records...</span>
          <kbd className="font-mono-num-sm text-[10px] bg-surface-container px-1 py-0.5 rounded text-on-surface-variant shadow-none">
            ⌘K
          </kbd>
        </div>

        {/* Currency Tag */}
        <span className="px-2 py-1 rounded bg-surface-container-low border border-[#EBEBEB] font-mono-num-sm text-label-sm text-on-surface font-medium hidden xs:inline">
          ₹ {user?.currency || 'INR'}
        </span>

        {/* Primary Add Transaction Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 bg-inverse-surface text-inverse-on-surface px-3 py-1.5 rounded-lg font-headline-sm text-label-md hover:bg-on-background transition-colors shadow-xs active:scale-[0.98]"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* User Avatar */}
        <button
          onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/20 transition-all"
          title="Account Settings"
          type="button"
        >
          <span className="material-symbols-outlined text-on-primary text-[17px]">person</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
