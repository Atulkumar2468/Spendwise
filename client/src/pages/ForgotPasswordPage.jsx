import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await API.post('/auth/forgot-password', { email });
      setMessage(
        res.data?.message ||
          'If an account exists with that email address, password reset instructions have been sent.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-inverse-surface flex items-center justify-center text-inverse-on-surface shadow-xs">
            <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Reset Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Enter your email to receive an expiring reset link
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-[#ECECEC] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-lg bg-error-container text-error text-xs font-medium border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex flex-col gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                <span className="font-semibold">{message}</span>
              </div>
              <p className="text-[12px] text-emerald-800">
                Check your private email inbox or spam folder for the secure reset link. It will expire in 15 minutes.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Account Email
              </label>
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              <span>Send Reset Instructions</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#F0EDED] text-xs text-on-surface-variant">
            Remember your credentials?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
