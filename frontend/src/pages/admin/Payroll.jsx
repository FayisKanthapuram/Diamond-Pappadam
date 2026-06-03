import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { payrollApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterField, FilterActions } from '../../components/FilterBar.jsx';
import { formatCurrency, formatKg, MONTHS } from '../../utils/format.js';

export default function Payroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  function load() {
    setLoading(true);
    payrollApi
      .list({ month, year })
      .then((res) => setPayrolls(res.data.payrolls))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load payroll'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [month, year]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await payrollApi.generate(month, year);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function markPaid() {
    try {
      await payrollApi.markPaid(payModal.id, { notes, paymentDate });
      toast.success('Marked as paid');
      setPayModal(null);
      setNotes('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  }

  return (
    <div>
      <PageHeader title="Payroll" />

      <Card className="mb-4 sm:mb-6">
        <div className="filter-stack">
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
              className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:max-w-[120px] sm:text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </FilterField>
          <FilterActions>
            <Button onClick={handleGenerate} disabled={generating} className="!w-full sm:!w-auto">
              {generating ? 'Generating...' : 'Generate Payroll'}
            </Button>
          </FilterActions>
        </div>
      </Card>

      <Card title={`${MONTHS[month - 1]} ${year}`}>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : payrolls.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No payroll records. Generate payroll for this month.</p>
        ) : (
          <>
            <div className="data-card-list">
              {payrolls.map((p) => (
                <div key={p.id} className="data-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-stone-900">{p.employeeName}</p>
                    <Badge status={p.paymentStatus}>{p.paymentStatus}</Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-stone-400">Dry KG</dt>
                      <dd>{p.totalDryMachineKg}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Non-Machine</dt>
                      <dd>{p.totalNonMachineKg}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Total KG</dt>
                      <dd>{formatKg(p.totalKg)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Earnings</dt>
                      <dd className="font-semibold text-brand-700">{formatCurrency(p.totalEarnings)}</dd>
                    </div>
                  </dl>
                  {p.paymentStatus === 'pending' && (
                    <Button className="mt-4 !w-full" variant="ghost" onClick={() => setPayModal(p)}>
                      Mark Paid
                    </Button>
                  )}
                  {p.notes && <p className="mt-2 text-xs text-stone-400">{p.notes}</p>}
                </div>
              ))}
            </div>

            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-medium">Employee</th>
                    <th className="pb-3 pr-3 font-medium">Dry KG</th>
                    <th className="pb-3 pr-3 font-medium">Non-Machine KG</th>
                    <th className="pb-3 pr-3 font-medium">Total KG</th>
                    <th className="pb-3 pr-3 font-medium">Earnings</th>
                    <th className="pb-3 pr-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 pr-3">{p.employeeName}</td>
                      <td className="py-3 pr-3">{p.totalDryMachineKg}</td>
                      <td className="py-3 pr-3">{p.totalNonMachineKg}</td>
                      <td className="py-3 pr-3">{formatKg(p.totalKg)}</td>
                      <td className="py-3 pr-3">{formatCurrency(p.totalEarnings)}</td>
                      <td className="py-3 pr-3">
                        <Badge status={p.paymentStatus}>{p.paymentStatus}</Badge>
                      </td>
                      <td className="py-3">
                        {p.paymentStatus === 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => setPayModal(p)}>Mark Paid</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Mark Salary as Paid">
        <p className="mb-4 text-sm text-stone-600">
          {payModal?.employeeName} — {formatCurrency(payModal?.totalEarnings)}
        </p>
        <div className="space-y-4">
          <Input label="Payment Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional payment notes" />
          <div className="btn-stack">
            <Button className="!w-full" onClick={markPaid}>Confirm Paid</Button>
            <Button className="!w-full" variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
