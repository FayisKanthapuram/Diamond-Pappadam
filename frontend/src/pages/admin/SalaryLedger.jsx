import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salaryLedgerApi, employeesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterSelect, FilterActions } from '../../components/FilterBar.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function SalaryLedger() {
  const [summaries, setSummaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = {};
    if (employeeId) params.employeeId = employeeId;
    salaryLedgerApi
      .listSummaries(params)
      .then((res) => setSummaries(res.data.summaries))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load ledger'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    employeesApi.list().then((res) => setEmployees(res.data.employees)).catch(() => {});
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Employee Salary Ledger"
        subtitle="Running balance per employee. Total earned from approved production net amounts."
      />

      <Card className="mb-4 sm:mb-6">
        <div className="filter-stack">
          <FilterSelect
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="sm:min-w-[200px]"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </FilterSelect>
          <FilterActions onApply={load} loading={loading} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : summaries.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No employees found.</p>
        ) : (
          <>
            <div className="data-card-list">
              {summaries.map((s) => (
                <Link
                  key={s.employeeId}
                  to={`/admin/salary-ledger/${s.employeeId}`}
                  className="data-card block transition hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-stone-900">{s.employeeName}</p>
                    {!s.active && (
                      <span className="text-xs text-stone-400">Inactive</span>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-stone-400">Earned</dt>
                      <dd className="font-medium">{formatCurrency(s.totalEarned)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Paid</dt>
                      <dd className="text-emerald-700">{formatCurrency(s.totalPaid)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Balance</dt>
                      <dd className="font-semibold text-brand-800">{formatCurrency(s.balance)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-brand-700">View ledger →</p>
                </Link>
              ))}
            </div>

            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-medium">Employee</th>
                    <th className="pb-3 pr-3 font-medium">Total Earned</th>
                    <th className="pb-3 pr-3 font-medium">Total Paid</th>
                    <th className="pb-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.employeeId} className="border-b border-stone-100">
                      <td className="py-3 pr-3">
                        <Link
                          to={`/admin/salary-ledger/${s.employeeId}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {s.employeeName}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">{formatCurrency(s.totalEarned)}</td>
                      <td className="py-3 pr-3 text-emerald-700">{formatCurrency(s.totalPaid)}</td>
                      <td className="py-3 font-semibold">{formatCurrency(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
