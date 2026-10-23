import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export const ResetPasswordPage = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await API.put(`/auth/reset-password/${resetToken}`, { password });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Password reset failed or token expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-inverse-surface flex items-center justify-center text-inverse-on-surface shadow-xs">
            <span className="material-symbols-outlined text-[26px]">vpn_key</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Create New Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Enter and confirm your new secure account password
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-[#ECECEC] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-lg bg-error-container text-error text-xs font-medium border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Password successfully reset! Redirecting to workspace...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="mt-1 w-full py-2.5 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              <span>Reset & Sign In</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#F0EDED] text-xs text-on-surface-variant">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
