import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import API from '../services/api';
import { formatCurrency } from '../utils/formatters';

export const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  // Statement PDF & Email states
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailingStatement, setEmailingStatement] = useState(false);
  const [statementSuccess, setStatementSuccess] = useState('');
  const [statementError, setStatementError] = useState('');

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      setStatementError('');
      const res = await API.get(`/analytics/statement/pdf?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SpendWise_Statement_${year}_${String(month).padStart(2, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setStatementError('Failed to generate PDF statement. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleEmailStatement = async () => {
    try {
      setEmailingStatement(true);
      setStatementError('');
      setStatementSuccess('');
      const res = await API.post('/analytics/statement/email', { month, year });
      if (res.data?.success) {
        setStatementSuccess(res.data.message || 'Statement and CSV ledger delivered to your inbox!');
        setTimeout(() => setStatementSuccess(''), 7000);
      }
    } catch (err) {
      setStatementError(err.response?.data?.message || err.message || 'Failed to email statement.');
    } finally {
      setEmailingStatement(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [histRes, catRes] = await Promise.all([
        API.get('/analytics/monthly'),
        API.get(`/analytics/categories?month=${month}&year=${year}`),
      ]);

      if (histRes.data?.success) {
        setHistoryData(histRes.data.history || []);
      }
      if (catRes.data?.success) {
        setCategoryData(catRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [month, year]);

  const distribution = categoryData?.distribution || [];
  const topCategory = categoryData?.topCategory || { name: 'None', amount: 0, percentage: 0 };
  const totalExpense = categoryData?.totalExpense || 0;
  const averageDailySpend = categoryData?.averageDailySpend || 0;

  // 6-month net savings calculation
  const totalSixMonthSavings = historyData.reduce((acc, curr) => acc + (curr.savings || 0), 0);

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const CHART_COLORS = [
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
    '#64748b',
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#ECECEC]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              INTELLIGENCE & TELEMETRY
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            Financial Analytics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Cash-flow trajectory, category spending distribution, and historical velocity.
          </p>
        </div>

        {/* Action Controls & Month Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month Selector */}
          <div className="flex items-center bg-surface-container-low border border-[#ECECEC] rounded-lg px-2.5 py-1.5 gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">calendar_month</span>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-on-surface font-body-sm outline-none cursor-pointer text-xs sm:text-sm font-medium"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {year}
                </option>
              ))}
            </select>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-[#ECECEC] shadow-xs disabled:opacity-50"
            type="button"
          >
            {downloadingPdf ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-on-surface border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[17px] text-error">picture_as_pdf</span>
            )}
            <span>Download PDF</span>
          </button>

          {/* Email Statement Button */}
          <button
            onClick={handleEmailStatement}
            disabled={emailingStatement}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-headline-sm text-label-md transition-colors shadow-xs disabled:opacity-50"
            type="button"
          >
            {emailingStatement ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[17px]">forward_to_inbox</span>
            )}
            <span>Email Statement</span>
          </button>
        </div>
      </div>

      {/* Statement Success Banner */}
      {statementSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-semibold border border-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">mark_email_read</span>
            <span>{statementSuccess}</span>
          </div>
          <button
            onClick={() => setStatementSuccess('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Statement Error Banner */}
      {statementError && (
        <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold border border-error/20 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{statementError}</span>
          </div>
          <button
            onClick={() => setStatementError('')}
            className="text-error hover:opacity-80"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* 4 Dense Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Outflow Category */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Top Outflow Category
            </span>
            <span className="material-symbols-outlined text-[18px] text-secondary">roofing</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-surface font-bold truncate">
              {topCategory.name}
            </div>
            <div className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold mt-0.5">
              {formatCurrency(topCategory.amount)}
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0EDED] flex items-center justify-between text-xs text-on-surface-variant">
            <span>Share of monthly spend</span>
            <span className="font-mono-num-sm font-bold text-on-surface">
              {topCategory.percentage}%
            </span>
          </div>
        </div>

        {/* 6-Month Net Savings */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              6-Month Net Savings
            </span>
            <span className="material-symbols-outlined text-[18px] text-primary">savings</span>
          </div>
          <div>
            <div
              className={`font-mono-num-lg text-mono-num-lg font-bold ${
                totalSixMonthSavings < 0 ? 'text-error' : 'text-on-surface'
              }`}
            >
              {formatCurrency(totalSixMonthSavings)}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-semibold flex items-center">
                <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>
                Accumulated Net
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0EDED] flex items-center justify-between text-xs text-on-surface-variant">
            <span>6-Month horizon</span>
            <span className="font-mono-num-sm text-primary font-bold">Positive Growth</span>
          </div>
        </div>

        {/* Average Daily Spend */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Average Daily Spend
            </span>
            <span className="material-symbols-outlined text-[18px] text-secondary">query_builder</span>
          </div>
          <div>
            <div className="font-mono-num-lg text-mono-num-lg text-on-surface font-bold">
              {formatCurrency(averageDailySpend)}
              <span className="text-on-surface-variant font-normal text-xs">/day</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              Pacing across elapsed calendar days
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0EDED] flex items-center justify-between text-xs text-on-surface-variant">
            <span>Total Month Spend</span>
            <span className="font-mono-num-sm font-bold text-on-surface">
              {formatCurrency(totalExpense)}
            </span>
          </div>
        </div>

        {/* Health Ratio / Velocity */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Category Velocity
            </span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">speed</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-surface font-bold">
              {distribution.length} Active Buckets
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              Diverse allocation across life needs
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0EDED] flex items-center justify-between text-xs text-on-surface-variant">
            <span>Reconciled</span>
            <span className="font-mono-num-sm text-tertiary font-bold">100% Balanced</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Six-Month Income vs Expenses Bar Chart */}
      <div className="bg-surface-container-lowest p-5 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              6-Month Income vs Expenses Trajectory
            </h2>
            <p className="text-xs text-on-surface-variant">
              Comparative cash inflow and outflow tracking across consecutive calendar months
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-surface-container font-mono-num-sm font-semibold">
            Recharts Financial Engine
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
              <XAxis dataKey="label" tick={{ fill: '#717973', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#717973', fontSize: 12 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ECECEC',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" name="Income (Inflow)" fill="#2e614a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses (Outflow)" fill="#5d5e63" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Donut Breakdown and Net Savings Line Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Expense Breakdown (Donut) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-5 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Category Expense Share
            </h2>
            <p className="text-xs text-on-surface-variant">
              Monthly expenditure segmented by category taxonomy
            </p>
          </div>

          {distribution.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-xs">
              No expenses recorded for this month to generate distribution.
            </div>
          ) : (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #ECECEC',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {distribution.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#F5F5F5]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color || CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="font-medium text-on-surface">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface font-semibold">{formatCurrency(cat.amount)}</span>
                      <span className="text-outline text-[11px]">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 6-Month Savings Velocity Trend (Line) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-5 rounded-xl border border-[#ECECEC] shadow-xs flex flex-col gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Net Savings & Cash Retained
            </h2>
            <p className="text-xs text-on-surface-variant">
              Monthly net surplus (Income − Expenses) velocity trendline
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                <XAxis dataKey="label" tick={{ fill: '#717973', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#717973', fontSize: 12 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Net Savings']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #ECECEC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Monthly Savings"
                  stroke="#2e614a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2e614a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
