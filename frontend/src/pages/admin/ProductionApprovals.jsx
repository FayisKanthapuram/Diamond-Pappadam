import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productionsApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ProductionFormModal from '../../components/ProductionFormModal.jsx';
import ProductionDetailModal from '../../components/ProductionDetailModal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatKg } from '../../utils/format.js';

export default function ProductionApprovals() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  function load() {
    setLoading(true);
    productionsApi
      .pending()
      .then((res) => setProductions(res.data.productions))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    setActionLoading(id);
    try {
      await productionsApi.approve(id);
      toast.success('Production approved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejecting) return;
    setSaving(true);
    try {
      await productionsApi.reject(rejecting.id, rejectionReason);
      toast.success('Production rejected');
      setRejecting(null);
      setRejectionReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div>
      <PageHeader
        title="Production Approvals"
        subtitle="Review and approve employee production entries."
      />

      <Card>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : productions.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No pending production entries.</p>
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
                    <StatusBadge status={p.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
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
                      <dd className="font-medium">{formatKg(p.totalKg)}</dd>
                    </div>
                  </dl>
                  <div className="btn-stack mt-4">
                    <Button variant="ghost" onClick={() => setViewing(p)}>View</Button>
                    <Button
                      onClick={() => handleApprove(p.id)}
                      disabled={actionLoading === p.id}
                    >
                      {actionLoading === p.id ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button variant="danger" onClick={() => { setRejecting(p); setRejectionReason(''); }}>
                      Reject
                    </Button>
                    <Button variant="secondary" onClick={() => setEditing(p)}>Edit</Button>
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
                    <th className="pb-3 pr-3 font-medium">Dry KG</th>
                    <th className="pb-3 pr-3 font-medium">Non-Machine KG</th>
                    <th className="pb-3 pr-3 font-medium">Total KG</th>
                    <th className="pb-3 pr-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 pr-3">{formatDate(p.date)}</td>
                      <td className="py-3 pr-3">{p.employeeName}</td>
                      <td className="py-3 pr-3">{p.dryMachineKg}</td>
                      <td className="py-3 pr-3">{p.nonMachineKg}</td>
                      <td className="py-3 pr-3">{formatKg(p.totalKg)}</td>
                      <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(p)}>View</Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(p.id)}
                            disabled={actionLoading === p.id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => { setRejecting(p); setRejectionReason(''); }}
                          >
                            Reject
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>Edit</Button>
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

      <ProductionDetailModal
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

      <Modal
        open={!!rejecting}
        onClose={() => { setRejecting(null); setRejectionReason(''); }}
        title="Reject Production"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-sm text-stone-600">
            Rejecting production for <strong>{rejecting?.employeeName}</strong> on{' '}
            {rejecting ? formatDate(rejecting.date) : ''}.
          </p>
          <Input
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            placeholder="Explain why this entry was rejected"
          />
          <div className="btn-stack">
            <Button type="submit" variant="danger" disabled={saving}>
              {saving ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setRejecting(null); setRejectionReason(''); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
