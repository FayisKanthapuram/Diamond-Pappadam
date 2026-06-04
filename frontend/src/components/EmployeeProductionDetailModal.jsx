import Modal from './ui/Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import {
  OriginalAmount,
  BonusAmount,
  DeductionAmount,
  NetAmount,
  NET_AMOUNT_TOOLTIP,
  getPaymentAmounts,
} from './PaymentAmountDisplay.jsx';
import ProductionItemsTable from './ProductionItemsTable.jsx';
import { formatDate, formatDateTime, formatKg } from '../utils/format.js';

function Section({ title, children }) {
  return (
    <section className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-stone-900">{children}</dd>
    </div>
  );
}

export default function EmployeeProductionDetailModal({ open, onClose, production }) {
  if (!production) return null;

  const { originalAmount, bonusAmount, deductionAmount, netAmount } = getPaymentAmounts(production);
  const reason = production.adjustmentReason?.trim() || '';
  const hasBonus = bonusAmount > 0;
  const hasDeduction = deductionAmount > 0;

  return (
    <Modal open={open} onClose={onClose} title="Production Details">
      <div className="space-y-4">
        <Section title="Production Information">
          <dl>
            <Row label="Date">{formatDate(production.date)}</Row>
            <Row label="Dry KG">{production.dryMachineKg}</Row>
            <Row label="Non-Machine KG">{production.nonMachineKg}</Row>
            <Row label="Total KG">{formatKg(production.totalKg)}</Row>
          </dl>
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Production Rows
            </p>
            <ProductionItemsTable items={production.items} />
          </div>
          <dl>
            {production.notes && (
              <div className="mt-2 rounded-lg bg-stone-50 p-3 text-sm">
                <p className="text-xs font-medium text-stone-500">Your Notes</p>
                <p className="mt-1 text-stone-700">{production.notes}</p>
              </div>
            )}
          </dl>
        </Section>

        <Section title="Payment Breakdown">
          <dl className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <Row label="Original Amount">
              <OriginalAmount amount={originalAmount} />
            </Row>
            <Row label="Bonus Amount">
              <BonusAmount amount={bonusAmount} />
            </Row>
            <Row label="Deduction Amount">
              <DeductionAmount amount={deductionAmount} />
            </Row>
            <div className="mt-2 flex justify-between gap-4 border-t border-stone-200 pt-3">
              <dt className="text-sm font-semibold text-stone-800" title={NET_AMOUNT_TOOLTIP}>
                Net Amount
              </dt>
              <dd>
                <NetAmount amount={netAmount} showTooltip />
              </dd>
            </div>
            <p className="mt-3 text-xs text-stone-500">{NET_AMOUNT_TOOLTIP}</p>
          </dl>
        </Section>

        <Section title="Approval Information">
          <dl>
            <Row label="Status">
              <StatusBadge status={production.status} />
            </Row>
            {production.status === 'approved' && (
              <>
                <Row label="Approved By">{production.approvedByName || '—'}</Row>
                <Row label="Approved Date">
                  {production.approvedAt ? formatDateTime(production.approvedAt) : '—'}
                </Row>
              </>
            )}
            {production.status === 'rejected' && production.rejectionReason && (
              <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm">
                <p className="text-xs font-medium text-red-800">Rejection Reason</p>
                <p className="mt-1 text-red-700">{production.rejectionReason}</p>
              </div>
            )}
            {production.status === 'pending' && (
              <p className="text-sm text-amber-700">Awaiting admin approval. Final pay is not set yet.</p>
            )}
          </dl>
        </Section>

        {(production.status === 'approved' || reason) && (
          <Section title="Reason">
            <dl className="space-y-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  Bonus Reason
                </dt>
                <dd className="mt-1 text-emerald-900">
                  {hasBonus ? reason || 'Bonus applied (no additional note provided)' : 'No bonus applied'}
                </dd>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-red-800">
                  Deduction Reason
                </dt>
                <dd className="mt-1 text-red-900">
                  {hasDeduction
                    ? reason || 'Deduction applied (no additional note provided)'
                    : 'No deduction applied'}
                </dd>
              </div>
            </dl>
          </Section>
        )}
      </div>
    </Modal>
  );
}
