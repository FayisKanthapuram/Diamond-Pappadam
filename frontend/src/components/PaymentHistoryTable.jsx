import { formatCurrency, formatDate } from '../utils/format.js';

export default function PaymentHistoryTable({ payments }) {
  if (!payments?.length) {
    return <p className="py-6 text-center text-stone-500">No payments recorded yet.</p>;
  }

  return (
    <>
      <div className="data-card-list print:hidden">
        {payments.map((p) => (
          <div key={p.id} className="data-card text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-stone-900">{formatDate(p.date)}</p>
              <p className="font-semibold text-emerald-700">{formatCurrency(p.amount)}</p>
            </div>
            {p.note && <p className="mt-1 text-stone-600">{p.note}</p>}
            <p className="mt-1 text-xs text-stone-400">Recorded by {p.createdByName || 'Admin'}</p>
          </div>
        ))}
      </div>

      <div className="data-table-wrap">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="pb-3 pr-3 font-medium">Date</th>
              <th className="pb-3 pr-3 font-medium">Amount Paid</th>
              <th className="pb-3 pr-3 font-medium">Note</th>
              <th className="pb-3 font-medium">Created By</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-stone-100">
                <td className="py-3 pr-3">{formatDate(p.date)}</td>
                <td className="py-3 pr-3 font-medium text-emerald-700">{formatCurrency(p.amount)}</td>
                <td className="py-3 pr-3">{p.note || '—'}</td>
                <td className="py-3">{p.createdByName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
