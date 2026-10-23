import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-inverse-surface flex items-center justify-center text-inverse-on-surface shadow-xs">
            <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              SpendWise
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Sign in to access your personal expense ledger
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-surface-container-lowest border border-[#ECECEC] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-lg bg-error-container text-error text-xs font-medium border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-outline hover:text-on-surface p-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              <span>Sign In to SpendWise</span>
            </button>
          </form>


          <div className="text-center pt-2 border-t border-[#F0EDED] text-xs text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
