import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength logic
  const getPasswordStrength = () => {
    if (!password) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Weak (< 6 chars)', color: 'text-error' };
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (hasLetters && hasNumbers && hasSpecial && password.length >= 8) {
      return { text: 'Strong', color: 'text-tertiary' };
    }
    if ((hasLetters && hasNumbers) || password.length >= 6) {
      return { text: 'Medium', color: 'text-amber-600' };
    }
    return { text: 'Weak', color: 'text-error' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        currency,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to create account.'
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
              Create SpendWise Account
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Personalized expense ledger with 16 pre-configured categories
            </p>
          </div>
        </div>

        {/* Form Card */}
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
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Password
                  </label>
                  {strength.text && (
                    <span className={`text-[10px] font-semibold ${strength.color}`}>
                      {strength.text}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Confirm Password
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
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#ECECEC] rounded-lg text-on-surface font-body-sm outline-none focus:bg-surface-container-lowest focus:border-primary cursor-pointer"
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="GBP">British Pound (£ GBP)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              <span>Create Account</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#F0EDED] text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
