import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardApi } from '../../api/index.js';
import StatCard from '../../components/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatCurrency, formatDate, formatKg } from '../../utils/format.js';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .employee()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-8 text-center text-stone-500">Loading...</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="My Dashboard" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Pending Entries" value={data.pendingEntries} />
        <StatCard label="Approved Entries" value={data.approvedEntries} />
        <StatCard label="Rejected Entries" value={data.rejectedEntries} />
        <StatCard
          label="Approved Production Today"
          value={formatKg(data.todayProductionKg)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <StatCard
          label="Approved Production This Month"
          value={formatKg(data.monthProductionKg)}
        />
        <StatCard
          label="Approved Earnings (Month)"
          value={formatCurrency(data.estimatedEarnings)}
          sub="Approved entries only"
        />
      </div>

      <Card title="Recent Production">
        {data.recentProductionEntries?.length > 0 ? (
          <>
            <div className="data-card-list">
              {data.recentProductionEntries.map((p) => (
                <div key={p.id} className="data-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-800">{formatDate(p.date)}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{formatKg(p.totalKg)}</p>
                  {p.status === 'approved' && (
                    <p className="mt-1 text-sm font-semibold text-brand-700">
                      {formatCurrency(p.totalAmount)}
                    </p>
                  )}
                  {p.status === 'rejected' && p.rejectionReason && (
                    <p className="mt-2 text-sm text-red-600">{p.rejectionReason}</p>
                  )}
                  {p.notes && <p className="mt-2 text-sm text-stone-400">{p.notes}</p>}
                </div>
              ))}
            </div>
            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-2 pr-3 font-medium">Date</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">KG</th>
                    <th className="pb-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentProductionEntries.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-2 pr-3">{formatDate(p.date)}</td>
                      <td className="py-2 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-2 pr-3">{formatKg(p.totalKg)}</td>
                      <td className="py-2">
                        {p.status === 'approved' ? formatCurrency(p.totalAmount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-stone-500">No production yet.</p>
        )}
        <Link
          to="/employee/history"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 active:opacity-70"
        >
          View production history →
        </Link>
      </Card>
    </div>
  );
}
