import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import TransactionModal from './components/TransactionModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import { useAuth } from './context/AuthContext';

function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('expense');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const location = useLocation();

  // Determine current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/overview':
        return user?.name ? `Welcome, ${user.name}` : 'Overview';
      case '/transactions':
        return 'Transactions';
      case '/categories':
        return 'Categories';
      case '/budgets':
        return 'Budgets & Envelopes';
      case '/analytics':
        return 'Financial Analytics';
      case '/settings':
        return 'Settings & Preferences';
      default:
        return 'Workspace';
    }
  };

  const handleOpenAddModal = (type = 'expense') => {
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleTransactionCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        title={getPageTitle()}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenAddModal={() => handleOpenAddModal('expense')}
      />

      {/* Main Content Area */}
      <main className="pt-14 lg:pl-[230px] min-h-[calc(100vh-3.5rem)] transition-all">
        <Routes>
          <Route
            path="/"
            element={<DashboardPage key={`dash-${refreshTrigger}`} onOpenAddModal={handleOpenAddModal} />}
          />
          <Route
            path="/overview"
            element={<DashboardPage key={`over-${refreshTrigger}`} onOpenAddModal={handleOpenAddModal} />}
          />
          <Route
            path="/transactions"
            element={<TransactionsPage key={`tx-${refreshTrigger}`} />}
          />
          <Route
            path="/categories"
            element={<CategoriesPage key={`cat-${refreshTrigger}`} />}
          />
          <Route
            path="/budgets"
            element={<BudgetsPage key={`bgt-${refreshTrigger}`} />}
          />
          <Route
            path="/analytics"
            element={<AnalyticsPage key={`anl-${refreshTrigger}`} />}
          />
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Add Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionCreated}
        initialType={modalInitialType}
      />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />

      {/* Protected Main Application Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
