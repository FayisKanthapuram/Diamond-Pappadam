import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reportsApi, employeesApi, productionsApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterSelect, FilterDate, FilterActions } from '../../components/FilterBar.jsx';
import ProductionFormModal from '../../components/ProductionFormModal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatCurrency, formatDate, formatKg } from '../../utils/format.js';

export default function Reports() {
  const [productions, setProductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employeesApi.list().then((res) => setEmployees(res.data.employees)).catch(() => {});
  }, []);

  function load() {
    setLoading(true);
    const params = {};
    if (employeeId) params.employeeId = employeeId;
    if (from) params.from = from;
    if (to) params.to = to;
    reportsApi
      .production(params)
      .then((res) => setProductions(res.data.productions))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(payload) {
    setSaving(true);
    try {
      await productionsApi.update(editing.id, payload);
      toast.success('Production updated');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this production entry?')) return;
    try {
      await productionsApi.delete(id);
      toast.success('Entry deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div>
      <PageHeader title="Production Reports" subtitle="Approved production entries only." />

      <Card className="mb-4 sm:mb-6">
        <div className="filter-stack">
          <FilterSelect label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="sm:min-w-[180px]">
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </FilterSelect>
          <FilterDate label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <FilterDate label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <FilterActions onApply={load} loading={loading} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : productions.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No records found.</p>
        ) : (
          <>
            <div className="data-card-list">
              {productions.map((p) => (
                <div key={p.id} className="data-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-stone-900">{p.employeeName}</p>
                      <p className="text-sm text-stone-500">{formatDate(p.date)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={p.status} />
                      <p className="font-bold text-brand-700">{formatCurrency(p.totalAmount)}</p>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-stone-400">Dry KG</dt>
                      <dd className="font-medium">{p.dryMachineKg}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Non-Machine</dt>
                      <dd className="font-medium">{p.nonMachineKg}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-stone-400">Rates (snapshot)</dt>
                      <dd className="text-xs text-stone-600">
                        {formatCurrency(p.dryMachineRate)}/kg · {formatCurrency(p.nonMachineRate)}/kg
                      </dd>
                    </div>
                    {p.notes && (
                      <div className="col-span-2">
                        <dt className="text-stone-400">Notes</dt>
                        <dd>{p.notes}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="btn-stack mt-4">
                    <Button variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-medium">Date</th>
                    <th className="pb-3 pr-3 font-medium">Employee</th>
                    <th className="pb-3 pr-3 font-medium">Status</th>
                    <th className="pb-3 pr-3 font-medium">Dry KG</th>
                    <th className="pb-3 pr-3 font-medium">Non-Machine KG</th>
                    <th className="pb-3 pr-3 font-medium">Rates</th>
                    <th className="pb-3 pr-3 font-medium">Total</th>
                    <th className="pb-3 pr-3 font-medium">Notes</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 pr-3">{formatDate(p.date)}</td>
                      <td className="py-3 pr-3">{p.employeeName}</td>
                      <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3 pr-3">{p.dryMachineKg}</td>
                      <td className="py-3 pr-3">{p.nonMachineKg}</td>
                      <td className="py-3 pr-3 text-xs text-stone-500">
                        {formatCurrency(p.dryMachineRate)}/kg · {formatCurrency(p.nonMachineRate)}/kg
                      </td>
                      <td className="py-3 pr-3">{formatCurrency(p.totalAmount)}</td>
                      <td className="py-3 pr-3 text-stone-500">{p.notes || '—'}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
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
