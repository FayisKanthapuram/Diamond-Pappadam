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
import ApprovalModal from '../../components/ApprovalModal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ProductionItemsTable from '../../components/ProductionItemsTable.jsx';
import { formatCurrency, formatDate, formatKg } from '../../utils/format.js';

export default function ProductionApprovals() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('pending');
  const [viewing, setViewing] = useState(null);
  const [approving, setApproving] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reverting, setReverting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  function load(tab = statusTab) {
    setLoading(true);
    let request;
    if (tab === 'pending') {
      request = productionsApi.pending();
    } else {
      request = productionsApi.list({ status: tab });
    }

    request
      .then((res) => setProductions(res.data.productions || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(statusTab);
  }, [statusTab]);

  async function handleApprove(adjustments) {
    if (!approving) return;
    setSaving(true);
    try {
      await productionsApi.approve(approving.id, adjustments);
      toast.success('Production approved');
      setApproving(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    } finally {
      setSaving(false);
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

  async function handleRevert() {
    if (!reverting) return;
    setSaving(true);
    try {
      await productionsApi.revert(reverting.id);
      toast.success('Production reverted to pending');
      setReverting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Revert failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      await productionsApi.delete(deleting.id);
      toast.success('Production entry deleted permanently');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Production Approvals"
        subtitle="Review quantities, apply bonus or deduction, then approve. Quantities cannot be changed here—use Edit for corrections."
      />

      {/* Tabs for Pending Approvals vs. History */}
      <div className="mb-4 flex border-b border-stone-200">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            statusTab === 'pending'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
          onClick={() => setStatusTab('pending')}
        >
          Pending Approvals
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            statusTab === 'approved'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
          onClick={() => setStatusTab('approved')}
        >
          Approved History
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            statusTab === 'rejected'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
          onClick={() => setStatusTab('rejected')}
        >
          Rejected History
        </button>
      </div>

      <Card>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : productions.length === 0 ? (
          <p className="py-8 text-center text-stone-500">
            {statusTab === 'pending'
              ? 'No pending production entries.'
              : statusTab === 'approved'
              ? 'No approved production entries found.'
              : 'No rejected production entries found.'}
          </p>
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
                      <dt className="text-stone-400">
                        {statusTab === 'pending' ? 'Original Amount' : 'Net Amount'}
                      </dt>
                      <dd className="font-medium">
                        {formatCurrency(p.netAmount || p.originalAmount || p.totalAmount)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-2">
                    <ProductionItemsTable items={p.items} compact />
                  </div>
                  <div className="btn-stack mt-4">
                    <Button variant="ghost" onClick={() => setViewing(p)}>View</Button>
                    {statusTab === 'pending' && (
                      <>
                        <Button onClick={() => setApproving(p)}>Approve</Button>
                        <Button variant="danger" onClick={() => { setRejecting(p); setRejectionReason(''); }}>
                          Reject
                        </Button>
                        <Button variant="secondary" onClick={() => setEditing(p)}>Edit</Button>
                      </>
                    )}
                    {(statusTab === 'approved' || statusTab === 'rejected') && (
                      <>
                        <Button variant="secondary" onClick={() => setReverting(p)}>
                          Revert to Pending
                        </Button>
                        <Button variant="danger" onClick={() => setDeleting(p)}>
                          Delete
                        </Button>
                      </>
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
                    <th className="pb-3 pr-3 font-medium">Employee</th>
                    <th className="pb-3 pr-3 font-medium">Dry KG</th>
                    <th className="pb-3 pr-3 font-medium">Non-Machine KG</th>
                    <th className="pb-3 pr-3 font-medium">
                      {statusTab === 'pending' ? 'Original' : 'Net Amount'}
                    </th>
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
                      <td className="py-3 pr-3">{formatCurrency(p.netAmount || p.originalAmount || p.totalAmount)}</td>
                      <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(p)}>View</Button>
                          {statusTab === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => setApproving(p)}>Approve</Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => { setRejecting(p); setRejectionReason(''); }}
                              >
                                Reject
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>Edit</Button>
                            </>
                          )}
                          {(statusTab === 'approved' || statusTab === 'rejected') && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => setReverting(p)}>
                                Revert
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => setDeleting(p)}>
                                Delete
                              </Button>
                            </>
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

      <ProductionDetailModal open={!!viewing} onClose={() => setViewing(null)} production={viewing} />

      <ApprovalModal
        open={!!approving}
        onClose={() => setApproving(null)}
        production={approving}
        onApprove={handleApprove}
        saving={saving}
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

      {/* Modal for Reverting Approved/Rejected Production */}
      <Modal
        open={!!reverting}
        onClose={() => setReverting(null)}
        title="Revert Production"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Are you sure you want to revert the approved production entry of{' '}
            <strong>{reverting?.employeeName}</strong> on{' '}
            {reverting ? formatDate(reverting.date) : ''} back to pending status?
          </p>
          <p className="text-xs text-stone-500 bg-amber-50 border border-amber-200 rounded-lg p-2">
            <strong>Note:</strong> Reverting this entry will reset its status to pending, clear any applied bonus/deduction adjustments, and subtract its net amount (<strong>{reverting ? formatCurrency(reverting.netAmount) : ''}</strong>) from the employee's ledger balance immediately.
          </p>
          <div className="btn-stack mt-4">
            <Button onClick={handleRevert} disabled={saving}>
              {saving ? 'Reverting...' : 'Confirm Revert'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setReverting(null)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for Permanently Deleting Production */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Production"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Are you sure you want to <strong>permanently delete</strong> this production entry of{' '}
            <strong>{deleting?.employeeName}</strong> on{' '}
            {deleting ? formatDate(deleting.date) : ''}?
          </p>
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
            <strong>Warning:</strong> This action cannot be undone. It will permanently remove the production record from the database and automatically adjust the employee's ledger balance.
          </p>
          <div className="btn-stack mt-4">
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Confirm Delete'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
