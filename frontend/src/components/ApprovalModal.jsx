import { useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';
import ProductionAmountBreakdown from './ProductionAmountBreakdown.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';
import { calculateNetAmount } from '../utils/calculations.js';

export default function ApprovalModal({ open, onClose, production, onApprove, saving }) {
  const [bonusAmount, setBonusAmount] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    if (open && production) {
      setBonusAmount('');
      setDeductionAmount('');
      setAdjustmentReason('');
    }
  }, [open, production]);

  const preview = useMemo(() => {
    if (!production) return null;
    const original = production.originalAmount ?? production.totalAmount ?? 0;
    const bonus = parseFloat(bonusAmount) || 0;
    const deduction = parseFloat(deductionAmount) || 0;
    return {
      originalAmount: original,
      bonusAmount: bonus,
      deductionAmount: deduction,
      netAmount: calculateNetAmount(original, bonus, deduction),
    };
  }, [production, bonusAmount, deductionAmount]);

  function handleSubmit(e) {
    e.preventDefault();
    const bonus = parseFloat(bonusAmount) || 0;
    const deduction = parseFloat(deductionAmount) || 0;
    if ((bonus > 0 || deduction > 0) && !adjustmentReason.trim()) {
      return;
    }
    if (preview && preview.netAmount < 0) {
      return;
    }
    onApprove({
      bonusAmount: bonus,
      deductionAmount: deduction,
      adjustmentReason: adjustmentReason.trim(),
    });
  }

  if (!production) return null;

  const needsReason =
    (parseFloat(bonusAmount) || 0) > 0 || (parseFloat(deductionAmount) || 0) > 0;

  return (
    <Modal open={open} onClose={onClose} title="Approve Production">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-stone-600">
          Approving <strong>{production.employeeName}</strong> — {formatDate(production.date)}
          {' · '}
          {production.dryMachineKg} kg dry, {production.nonMachineKg} kg non-machine
        </p>

        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Approval Summary
          </p>
          <ProductionAmountBreakdown
            production={{
              ...production,
              bonusAmount: preview?.bonusAmount ?? 0,
              deductionAmount: preview?.deductionAmount ?? 0,
              netAmount: preview?.netAmount,
              status: 'approved',
            }}
            showReason={false}
          />
        </div>

        <Input
          label="Bonus Amount (optional)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={bonusAmount}
          onChange={(e) => setBonusAmount(e.target.value)}
          placeholder="e.g. 100"
        />
        <Input
          label="Deduction Amount (optional)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={deductionAmount}
          onChange={(e) => setDeductionAmount(e.target.value)}
          placeholder="e.g. 50"
        />
        <Input
          label={needsReason ? 'Adjustment Reason (required)' : 'Adjustment Reason (optional)'}
          value={adjustmentReason}
          onChange={(e) => setAdjustmentReason(e.target.value)}
          required={needsReason}
          placeholder="e.g. Excellent quality; small wastage deduction"
        />

        {preview && preview.netAmount < 0 && (
          <p className="text-sm text-red-600">Net amount cannot be negative.</p>
        )}

        <div className="btn-stack">
          <Button
            type="submit"
            disabled={saving || (preview && preview.netAmount < 0) || (needsReason && !adjustmentReason.trim())}
          >
            {saving ? 'Approving...' : `Confirm Approval (${formatCurrency(preview?.netAmount ?? production.totalAmount)})`}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
