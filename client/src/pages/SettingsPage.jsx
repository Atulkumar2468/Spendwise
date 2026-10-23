import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { formatCurrency } from '../utils/formatters';

export const SettingsPage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [monthlyBudget, setMonthlyBudget] = useState(user?.monthlyBudget?.toString() || '60000');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ text: '', type: '' });

    try {
      await updateProfile({
        name: name.trim(),
        currency,
        monthlyBudget: parseFloat(monthlyBudget) || 60000,
      });
      setProfileMessage({ text: 'Profile preferences updated successfully.', type: 'success' });
    } catch (err) {
      setProfileMessage({
        text: err.response?.data?.message || err.message || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    setPasswordLoading(true);

    try {
      await API.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMessage({ text: 'Password successfully changed.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordMessage({
        text: err.response?.data?.message || err.message || 'Failed to change password.',
        type: 'error',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const res = await API.get('/transactions?limit=1000');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `SpendWise_Complete_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#ECECEC]">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
          Account & Preferences
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Manage your personal profile, default currency, deterministic budget cap, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#ECECEC] shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0F0]">
            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Profile & Preferences
            </h2>
          </div>

          {profileMessage.text && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                profileMessage.type === 'success'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-error-container text-error'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="px-3 py-2 bg-surface-container border border-[#ECECEC] rounded-lg text-on-surface-variant font-body-sm outline-none cursor-not-allowed opacity-80"
              />
              <span className="text-[11px] text-outline">Email address cannot be changed</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:border-primary cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                  Monthly Budget Cap
                </label>
                <input
                  type="number"
                  step="1000"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-mono-num-md outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-4 py-2 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                {profileLoading && (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#ECECEC] shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0F0]">
            <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Security & Credentials
            </h2>
          </div>

          {passwordMessage.text && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                passwordMessage.type === 'success'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-error-container text-error'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase font-semibold">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {passwordLoading && (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ledger Data & Session Card */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#ECECEC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Data Portability & Audit
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Download your entire financial ledger records in JSON format for offline audit or tax compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportAll}
            className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-colors flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Download All Data</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-lg bg-error-container text-error hover:bg-error hover:text-on-error font-label-md text-xs font-semibold transition-colors flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
