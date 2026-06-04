import { formatCurrency } from '../utils/format.js';

export default function SalaryLedgerSummary({ totalEarned, totalPaid, balance, employeeName }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {employeeName && (
        <div className="sm:col-span-3">
          <h2 className="text-lg font-semibold text-stone-900">{employeeName}</h2>
        </div>
      )}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Total Earned</p>
        <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(totalEarned)}</p>
        <p className="mt-1 text-xs text-stone-400">Approved production (net)</p>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Total Paid</p>
        <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
        <p className="mt-1 text-xs text-stone-400">All salary payments</p>
      </div>
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-800">Current Balance</p>
        <p className="mt-1 text-xl font-bold text-brand-900">{formatCurrency(balance)}</p>
        <p className="mt-1 text-xs text-brand-700">Earned − Paid</p>
      </div>
    </div>
  );
}
