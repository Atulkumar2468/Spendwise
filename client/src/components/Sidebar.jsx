import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: 'space_dashboard' },
    { name: 'Transactions', path: '/transactions', icon: 'receipt_long' },
    { name: 'Categories', path: '/categories', icon: 'category' },
    { name: 'Budgets', path: '/budgets', icon: 'pie_chart' },
    { name: 'Analytics', path: '/analytics', icon: 'insights' },
    { name: 'Settings', path: '/settings', icon: 'tune' },
  ];

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-on-background/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[230px] bg-surface-container-lowest z-50 flex flex-col justify-between border-r border-[#ECECEC] shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Logo Header */}
          <div className="h-14 px-space-md flex items-center justify-between border-b border-[#F0F0F0]">
            <NavLink
              to="/"
              onClick={onClose}
              className="flex items-center gap-space-sm min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-inverse-surface flex items-center justify-center text-inverse-on-surface shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                  SpendWise
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  Personal Expense
                </span>
              </div>
            </NavLink>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-space-sm pt-space-sm">
            <nav className="flex flex-col gap-space-xs">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-body-md transition-colors ${
                      isActive
                        ? 'bg-surface-container text-on-surface font-headline-sm font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-normal'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile Card at Bottom */}
        <div className="p-space-sm m-space-sm rounded-lg bg-surface-container-low border border-[#F0F0F0] flex flex-col gap-space-xs">
          <div className="flex items-center justify-between gap-space-xs">
            <NavLink
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-space-xs min-w-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[15px]">person</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-on-surface truncate font-medium">
                  {user?.name || 'User'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono-num-sm">
                  {user?.currency || 'INR'} (₹)
                </span>
              </div>
            </NavLink>

            <button
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error flex items-center justify-center p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              title="Sign out"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
