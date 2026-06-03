import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productionsApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterDate, FilterActions } from '../../components/FilterBar.jsx';
import ProductionFormModal from '../../components/ProductionFormModal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatCurrency, formatDate, formatKg } from '../../utils/format.js';

export default function MyProduction() {
  const [productions, setProductions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
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
        subtitle="Pending and rejected entries can be edited. Approved entries are locked."
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
                    {p.status === 'approved' && (
                      <div className="col-span-2">
                        <dt className="text-stone-400">Amount</dt>
                        <dd className="font-semibold text-brand-700">{formatCurrency(p.totalAmount)}</dd>
                      </div>
                    )}
                    {p.notes && (
                      <div className="col-span-2">
                        <dt className="text-stone-400">Notes</dt>
                        <dd>{p.notes}</dd>
                      </div>
                    )}
                    {p.status === 'rejected' && p.rejectionReason && (
                      <div className="col-span-2 rounded-lg bg-red-50 p-2">
                        <dt className="text-red-700">Rejection Reason</dt>
                        <dd className="text-red-600">{p.rejectionReason}</dd>
                      </div>
                    )}
                  </dl>
                  {p.canEdit && (
                    <Button className="mt-4 !w-full" variant="ghost" onClick={() => setEditing(p)}>
                      Edit
                    </Button>
                  )}
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
                    <th className="pb-3 pr-3 font-medium">Total</th>
                    <th className="pb-3 pr-3 font-medium">Notes</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 pr-3">{formatDate(p.date)}</td>
                      <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3 pr-3">{p.dryMachineKg}</td>
                      <td className="py-3 pr-3">{p.nonMachineKg}</td>
                      <td className="py-3 pr-3">
                        {p.status === 'approved' ? formatCurrency(p.totalAmount) : formatKg(p.totalKg)}
                      </td>
                      <td className="py-3 pr-3 text-stone-500">
                        {p.rejectionReason ? (
                          <span className="text-red-600">{p.rejectionReason}</span>
                        ) : (
                          p.notes || '—'
                        )}
                      </td>
                      <td className="py-3">
                        {p.canEdit && (
                          <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
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
