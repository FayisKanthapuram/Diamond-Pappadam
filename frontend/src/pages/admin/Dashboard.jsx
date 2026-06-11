import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardApi } from '../../api/index.js';
import StatCard from '../../components/StatCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatCurrency, formatKg } from '../../utils/format.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .admin()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-8 text-center text-stone-500">Loading dashboard...</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Admin Dashboard's" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Pending Approvals"
          value={data.pendingApprovalsCount}
          sub={
            data.pendingApprovalsCount > 0 ? (
              <Link to="/admin/approvals" className="text-brand-700 hover:underline">
                Review now →
              </Link>
            ) : (
              'All caught up'
            )
          }
        />
        <StatCard
          label="Approved Production Today"
          value={formatKg(data.todayProductionKg)}
          sub="Approved entries only"
        />
        <StatCard
          label="Approved Production This Month"
          value={formatKg(data.monthProductionKg)}
          sub="Approved entries only"
        />
        <StatCard
          label="Today's Salary Cost"
          value={formatCurrency(data.todaySalaryCost)}
          sub="From approved production"
        />
        <StatCard
          label="This Month Salary Cost"
          value={formatCurrency(data.monthSalaryCost)}
          sub="From approved production"
        />
        <StatCard
          label="Outstanding Salary Liability"
          value={formatCurrency(data.outstandingSalaryLiability)}
          sub={
            <Link to="/admin/salary-ledger" className="text-brand-700 hover:underline">
              View salary ledger →
            </Link>
          }
        />
        <StatCard label="Active Employees" value={data.activeEmployees} />
      </div>
    </div>
  );
}
