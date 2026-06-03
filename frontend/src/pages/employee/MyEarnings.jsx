import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productionsApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterField } from '../../components/FilterBar.jsx';
import { formatCurrency, formatKg, MONTHS } from '../../utils/format.js';

export default function MyEarnings() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productionsApi
      .myEarnings({ month, year })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
    <div className="w-full max-w-lg">
      <PageHeader title="My Earnings" subtitle="Based on approved production entries only." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilterField label="Month">
          <select
            className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Year">
          <input
            type="number"
            className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </FilterField>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading...</p>
      ) : data ? (
        <Card title={`${MONTHS[month - 1]} ${year}`}>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt className="text-stone-500">Dry Machine KG</dt>
              <dd className="font-medium">{data.dryMachineKg}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt className="text-stone-500">Non-Machine KG</dt>
              <dd className="font-medium">{data.nonMachineKg}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt className="text-stone-500">Total KG</dt>
              <dd className="font-medium">{formatKg(data.totalKg)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt className="text-stone-500">Dry Machine Earnings</dt>
              <dd>{formatCurrency(data.dryMachineAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt className="text-stone-500">Non-Machine Earnings</dt>
              <dd>{formatCurrency(data.nonMachineAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-base font-semibold">Total Earnings</dt>
              <dd className="text-lg font-bold text-brand-700">{formatCurrency(data.totalEarnings)}</dd>
            </div>
            <p className="text-xs text-stone-400">{data.entryCount} production entries</p>
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
