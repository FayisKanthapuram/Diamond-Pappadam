import Modal from './ui/Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import ProductionAmountBreakdown from './ProductionAmountBreakdown.jsx';
import ProductionItemsTable from './ProductionItemsTable.jsx';
import { formatDate, formatDateTime, formatKg } from '../utils/format.js';

export default function ProductionDetailModal({ open, onClose, production }) {
  if (!production) return null;

  return (
    <Modal open={open} onClose={onClose} title="Production Details">
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-stone-500">Status</dt>
          <dd><StatusBadge status={production.status} /></dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Date</dt>
          <dd className="font-medium">{formatDate(production.date)}</dd>
        </div>
        {production.employeeName && (
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Employee</dt>
            <dd className="font-medium">{production.employeeName}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Dry Machine KG</dt>
          <dd>{production.dryMachineKg}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Non-Machine KG</dt>
          <dd>{production.nonMachineKg}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Total KG</dt>
          <dd className="font-medium">{formatKg(production.totalKg)}</dd>
        </div>

        <div className="border-t border-stone-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Production Rows
          </p>
          <ProductionItemsTable items={production.items} />
        </div>

        <div className="border-t border-stone-100 pt-3">
          <ProductionAmountBreakdown production={production} />
        </div>

        {production.notes && (
          <div>
            <dt className="text-stone-500">Employee Notes</dt>
            <dd className="mt-1">{production.notes}</dd>
          </div>
        )}
        {production.status === 'rejected' && production.rejectionReason && (
          <div className="rounded-lg bg-red-50 p-3">
            <dt className="font-medium text-red-800">Rejection Reason</dt>
            <dd className="mt-1 text-red-700">{production.rejectionReason}</dd>
          </div>
        )}
        <div className="border-t border-stone-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Audit Trail</p>
          <div className="space-y-2 text-xs text-stone-600">
            <p>Created: {formatDateTime(production.createdAt)}</p>
            <p>Updated: {formatDateTime(production.updatedAt)}</p>
            {production.approvedAt && (
              <p>
                Approved: {formatDateTime(production.approvedAt)}
                {production.approvedByName ? ` by ${production.approvedByName}` : ''}
              </p>
            )}
            {production.adjustedAt && (
              <p>
                Adjusted: {formatDateTime(production.adjustedAt)}
                {production.adjustedByName ? ` by ${production.adjustedByName}` : ''}
              </p>
            )}
          </div>
        </div>
      </dl>
    </Modal>
  );
}
