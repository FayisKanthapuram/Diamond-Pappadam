import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productionsApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterDate, FilterActions } from '../../components/FilterBar.jsx';
import ProductionFormModal from '../../components/ProductionFormModal.jsx';
import EmployeeProductionDetailModal from '../../components/EmployeeProductionDetailModal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ProductionAmountBreakdown from '../../components/ProductionAmountBreakdown.jsx';
import {
  OriginalAmount,
  BonusAmount,
  DeductionAmount,
  NetAmount,
  NetAmountHeader,
  getPaymentAmounts,
} from '../../components/PaymentAmountDisplay.jsx';
import { formatDate, formatKg } from '../../utils/format.js';

function PaymentTableCells({ production }) {
  const { originalAmount, bonusAmount, deductionAmount, netAmount } = getPaymentAmounts(production);
  const isApproved = production.status === 'approved';

  return (
    <>
      <td className="py-3 pr-3">
        <OriginalAmount amount={originalAmount} />
      </td>
      <td className="py-3 pr-3">
        {isApproved ? <BonusAmount amount={bonusAmount} /> : <BonusAmount amount={0} />}
      </td>
      <td className="py-3 pr-3">
        {isApproved ? <DeductionAmount amount={deductionAmount} /> : <DeductionAmount amount={0} />}
      </td>
      <td className="py-3 pr-3">
        {isApproved ? <NetAmount amount={netAmount} showTooltip /> : <span className="text-stone-400">—</span>}
      </td>
    </>
  );
}

export default function MyProduction() {
  const [productions, setProductions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    productionsApi
      .mine(params)
      .then((res) => setProductions(res.data.productions))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(payload) {
    setSaving(true);
    try {
      await productionsApi.update(editing.id, payload);
      toast.success('Production updated and resubmitted for approval');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Production History"
        subtitle="See how your pay is calculated: original amount, bonus, deduction, and net. Pending entries can still be edited."
      />

      <Card className="mb-4 sm:mb-6">
        <div className="filter-stack">
          <FilterDate label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <FilterDate label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <FilterActions onApply={load} loading={loading} applyLabel="Filter" />
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : productions.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No production entries yet.</p>
        ) : (
          <>
            <div className="data-card-list">
              {productions.map((p) => (
                <div key={p.id} className="data-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-stone-900">{formatDate(p.date)}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-stone-400">Dry KG</dt>
                      <dd>{p.dryMachineKg}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Non-Machine</dt>
                      <dd>{p.nonMachineKg}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-stone-400">Total KG</dt>
                      <dd>{formatKg(p.totalKg)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <ProductionAmountBreakdown
                      production={p}
                      showReason={false}
                      alwaysShowAdjustments={p.status === 'approved'}
                      compact
                    />
                  </div>
                  {p.status === 'rejected' && p.rejectionReason && (
                    <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm">
                      <p className="text-xs font-medium text-red-800">Rejection Reason</p>
                      <p className="mt-1 text-red-700">{p.rejectionReason}</p>
                    </div>
                  )}
                  <div className="btn-stack mt-4">
                    <Button variant="ghost" onClick={() => setViewing(p)}>
                      View Details
                    </Button>
                    {p.canEdit && (
                      <Button variant="secondary" onClick={() => setEditing(p)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-medium">Date</th>
                    <th className="pb-3 pr-3 font-medium">Status</th>
                    <th className="pb-3 pr-3 font-medium">Dry KG</th>
                    <th className="pb-3 pr-3 font-medium">Non-Machine KG</th>
                    <th className="pb-3 pr-3 font-medium">Original Amount</th>
                    <th className="pb-3 pr-3 font-medium">Bonus Amount</th>
                    <th className="pb-3 pr-3 font-medium">Deduction Amount</th>
                    <th className="pb-3 pr-3 font-medium">
                      <NetAmountHeader />
                    </th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 pr-3">{formatDate(p.date)}</td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 pr-3">{p.dryMachineKg}</td>
                      <td className="py-3 pr-3">{p.nonMachineKg}</td>
                      <PaymentTableCells production={p} />
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(p)}>
                            View Details
                          </Button>
                          {p.canEdit && (
                            <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <EmployeeProductionDetailModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        production={viewing}
      />

      <ProductionFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        initial={editing}
        title="Edit Production"
        saving={saving}
      />
    </div>
  );
}
