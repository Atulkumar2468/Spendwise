import React, { useState, useRef } from 'react';
import API from '../services/api';
import { formatCurrency } from '../utils/formatters';

export const ImportStatementModal = ({ isOpen, onClose, onSuccess, categories = [] }) => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Auto-categorize heuristic based on title/merchant
  const autoDetectCategory = (title, type) => {
    const text = (title || '').toLowerCase();
    const available = categories.filter((c) => c.type === type);

    if (type === 'income') {
      if (text.includes('salary') || text.includes('payroll')) return available.find((c) => c.name.toLowerCase().includes('salary'))?._id;
      if (text.includes('freelance') || text.includes('upwork')) return available.find((c) => c.name.toLowerCase().includes('freelance'))?._id;
      if (text.includes('dividend') || text.includes('interest') || text.includes('groww') || text.includes('zerodha')) return available.find((c) => c.name.toLowerCase().includes('invest'))?._id;
      return available[0]?._id;
    }

    if (text.includes('swiggy') || text.includes('zomato') || text.includes('food') || text.includes('cafe') || text.includes('restaurant') || text.includes('mess')) {
      return available.find((c) => c.name.toLowerCase().includes('food'))?._id;
    }
    if (text.includes('uber') || text.includes('ola') || text.includes('metro') || text.includes('petrol') || text.includes('fuel') || text.includes('travel')) {
      return available.find((c) => c.name.toLowerCase().includes('transport'))?._id;
    }
    if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('shopping') || text.includes('store') || text.includes('mall')) {
      return available.find((c) => c.name.toLowerCase().includes('shopping'))?._id;
    }
    if (text.includes('rent') || text.includes('society') || text.includes('housing')) {
      return available.find((c) => c.name.toLowerCase().includes('rent'))?._id;
    }
    if (text.includes('gym') || text.includes('fitness') || text.includes('cult')) {
      return available.find((c) => c.name.toLowerCase().includes('gym'))?._id;
    }
    if (text.includes('netflix') || text.includes('spotify') || text.includes('movie') || text.includes('cinema') || text.includes('prime')) {
      return available.find((c) => c.name.toLowerCase().includes('entertain'))?._id;
    }
    if (text.includes('electricity') || text.includes('water') || text.includes('wifi') || text.includes('airtel') || text.includes('jio') || text.includes('bill')) {
      return available.find((c) => c.name.toLowerCase().includes('bill'))?._id;
    }
    if (text.includes('hospital') || text.includes('clinic') || text.includes('pharmacy') || text.includes('apollo') || text.includes('medical')) {
      return available.find((c) => c.name.toLowerCase().includes('health'))?._id;
    }

    const otherCat = available.find((c) => c.name.toLowerCase() === 'other');
    return otherCat?._id || available[0]?._id;
  };

  // Parse CSV text into row objects
  const parseCSV = (csvText) => {
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least one transaction row.');
      }

      // Parse headers
      const rawHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

      // Helper to find column index by multiple synonyms
      const findCol = (...synonyms) => {
        return rawHeaders.findIndex((h) => synonyms.some((s) => h.includes(s)));
      };

      const dateIdx = findCol('date', 'txn date', 'transaction date', 'value date', 'time');
      const descIdx = findCol('description', 'narration', 'particulars', 'title', 'merchant', 'details', 'name', 'remarks');
      const debitIdx = findCol('debit', 'withdrawal', 'dr', 'expense');
      const creditIdx = findCol('credit', 'deposit', 'cr', 'income');
      const amountIdx = findCol('amount', 'amt', 'value');
      const methodIdx = findCol('account', 'method', 'payment method', 'mode', 'type');

      if (dateIdx === -1 && descIdx === -1 && amountIdx === -1 && debitIdx === -1) {
        throw new Error('Could not identify statement columns. Please ensure Date, Description, and Amount/Debit/Credit columns exist.');
      }

      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        // Handle CSV split with commas inside quotes
        const line = lines[i];
        if (!line.trim()) continue;

        const cells = [];
        let curr = '';
        let insideQuote = false;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            cells.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        cells.push(curr.trim());

        // Extract date
        const rawDate = dateIdx !== -1 ? cells[dateIdx] : '';
        let dateVal = new Date();
        if (rawDate) {
          // Check common DD/MM/YYYY or DD-MM-YYYY
          const parts = rawDate.split(/[-/]/);
          if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
            dateVal = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) dateVal = parsed;
          }
        }

        // Extract description
        const title = descIdx !== -1 ? cells[descIdx]?.replace(/^["']|["']$/g, '').trim() : `Statement Transaction #${i}`;
        if (!title) continue;

        // Extract amount & type
        let amount = 0;
        let type = 'expense';

        if (debitIdx !== -1 || creditIdx !== -1) {
          const debitVal = debitIdx !== -1 ? parseFloat(cells[debitIdx]?.replace(/[^0-9.-]/g, '')) || 0 : 0;
          const creditVal = creditIdx !== -1 ? parseFloat(cells[creditIdx]?.replace(/[^0-9.-]/g, '')) || 0 : 0;

          if (creditVal > 0) {
            type = 'income';
            amount = creditVal;
          } else if (debitVal > 0) {
            type = 'expense';
            amount = debitVal;
          } else if (amountIdx !== -1) {
            const rawAmt = parseFloat(cells[amountIdx]?.replace(/[^0-9.-]/g, '')) || 0;
            amount = Math.abs(rawAmt);
            type = rawAmt >= 0 ? 'income' : 'expense';
          }
        } else if (amountIdx !== -1) {
          const rawAmt = parseFloat(cells[amountIdx]?.replace(/[^0-9.-]/g, '')) || 0;
          amount = Math.abs(rawAmt);
          type = rawAmt >= 0 ? 'income' : 'expense';
        }

        if (amount <= 0) continue;

        const categoryId = autoDetectCategory(title, type);
        const paymentMethod = methodIdx !== -1 && cells[methodIdx] ? cells[methodIdx].replace(/^["']|["']$/g, '').trim() : 'UPI / QR';

        rows.push({
          id: `row-${i}-${Date.now()}`,
          title,
          amount,
          type,
          categoryId,
          transactionDate: dateVal.toISOString().split('T')[0],
          paymentMethod,
          notes: 'Imported via Statement CSV',
        });
      }

      if (rows.length === 0) {
        throw new Error('No valid positive transaction amounts found in this file.');
      }

      setParsedRows(rows);
      setParsingError('');
    } catch (err) {
      setParsingError(err.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParsingError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.onerror = () => {
      setParsingError('Failed to read the file.');
    };
    reader.readAsText(selected);
  };

  const handleRowCategoryChange = (rowId, newCatId) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, categoryId: newCatId } : r))
    );
  };

  const handleRowTypeChange = (rowId, newType) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const newCat = autoDetectCategory(r.title, newType);
          return { ...r, type: newType, categoryId: newCat };
        }
        return r;
      })
    );
  };

  const handleRemoveRow = (rowId) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleDownloadSample = () => {
    const sampleContent =
`Date,Description,Debit,Credit,Payment Method
2026-10-20,Swiggy Gourmet Dinner,850.00,,UPI / QR
2026-10-21,Uber Premier Airport,620.00,,Credit Card
2026-10-22,Salary Credit - Monthly,,75000.00,Bank Transfer
2026-10-22,Amazon Shopping - Headphones,2499.00,,Debit Card
2026-10-23,Cult Gym Membership,1500.00,,UPI / QR`;

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SpendWise_Sample_Bank_Statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setParsingError('');

    try {
      const res = await API.post('/transactions/import', { items: parsedRows });
      if (res.data?.success) {
        onSuccess(res.data.count);
        handleClose();
      }
    } catch (err) {
      setParsingError(err.response?.data?.message || err.message || 'Failed to import transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setParsingError('');
    onClose();
  };

  const totalExpense = parsedRows.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = parsedRows.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-[#ECECEC] rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#ECECEC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-inverse-surface flex items-center justify-center text-inverse-on-surface shadow-xs">
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Import Bank Statement / CSV
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Upload your bank statement or CSV ledger to automatically categorize and log records
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
          {parsingError && (
            <div className="p-3 rounded-lg bg-error-container text-error text-xs font-medium border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{parsingError}</span>
            </div>
          )}

          {/* Upload Area */}
          {parsedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#DCDCDC] hover:border-primary/50 rounded-2xl p-8 bg-surface-container-low/50 transition-colors gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
              </div>
              <div>
                <p className="font-headline-sm text-on-surface font-semibold text-sm">
                  Drag and drop your statement CSV here, or{' '}
                  <label className="text-primary hover:underline cursor-pointer">
                    browse files
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Supports HDFC, SBI, ICICI, Axis, Credit Card, and generic statement exports
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="mt-2 text-xs text-secondary hover:text-on-surface flex items-center gap-1.5 underline decoration-dotted font-medium"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                Download Sample Statement Template (.csv)
              </button>
            </div>
          ) : (
            /* Parsed Preview Table */
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-[#ECECEC]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-inverse-surface text-inverse-on-surface">
                    {parsedRows.length} transactions ready
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    File: <strong className="text-on-surface">{file?.name}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono-num-sm">
                  <span className="text-error font-medium">
                    Total Debit: -{formatCurrency(totalExpense)}
                  </span>
                  <span className="text-emerald-600 font-medium">
                    Total Credit: +{formatCurrency(totalIncome)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFile(null);
                    }}
                    className="text-xs text-outline hover:text-error transition-colors underline"
                  >
                    Clear & Upload Another
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-[#ECECEC] rounded-xl overflow-hidden shadow-xs max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container sticky top-0 z-10 text-on-surface-variant uppercase tracking-wider font-semibold border-b border-[#ECECEC]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECECEC] bg-surface-container-lowest">
                    {parsedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-2 px-3 font-mono-num-sm whitespace-nowrap text-on-surface-variant">
                          {row.transactionDate}
                        </td>
                        <td className="py-2 px-3 font-medium text-on-surface max-w-[200px] truncate" title={row.title}>
                          {row.title}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <select
                            value={row.type}
                            onChange={(e) => handleRowTypeChange(row.id, e.target.value)}
                            className="bg-surface-container-low border border-[#E0E0E0] rounded px-1.5 py-1 text-xs outline-none focus:border-primary font-medium"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.categoryId}
                            onChange={(e) => handleRowCategoryChange(row.id, e.target.value)}
                            className="bg-surface-container-low border border-[#E0E0E0] rounded px-2 py-1 text-xs outline-none focus:border-primary max-w-[150px] truncate font-medium"
                          >
                            {categories
                              .filter((c) => c.type === row.type)
                              .map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right font-mono-num-sm font-semibold whitespace-nowrap">
                          <span className={row.type === 'income' ? 'text-emerald-600' : 'text-on-surface'}>
                            {row.type === 'income' ? '+' : '-'}
                            {formatCurrency(row.amount)}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-outline hover:text-error p-1 transition-colors"
                            title="Remove row"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-surface-container-low/50 border-t border-[#ECECEC]">
          <span className="text-xs text-on-surface-variant font-medium">
            {parsedRows.length > 0
              ? 'Review entries before confirming import to your financial ledger'
              : 'Select a CSV file to begin'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#ECECEC] hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={loading || parsedRows.length === 0}
              className="px-4 py-2 rounded-lg bg-inverse-surface hover:bg-on-background text-inverse-on-surface text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <span>Import {parsedRows.length} Transactions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStatementModal;
