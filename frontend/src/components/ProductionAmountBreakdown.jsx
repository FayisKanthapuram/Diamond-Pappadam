import {
  OriginalAmount,
  BonusAmount,
  DeductionAmount,
  NetAmount,
  NET_AMOUNT_TOOLTIP,
  getPaymentAmounts,
} from './PaymentAmountDisplay.jsx';

export default function ProductionAmountBreakdown({
  production,
  showReason = true,
  compact = false,
  alwaysShowAdjustments = false,
}) {
  if (!production) return null;

  const { originalAmount, bonusAmount, deductionAmount, netAmount } = getPaymentAmounts(production);
  const showLines =
    alwaysShowAdjustments ||
    production.status === 'approved' ||
    bonusAmount > 0 ||
    deductionAmount > 0;

  const rowClass = compact
    ? 'flex justify-between gap-4 text-sm'
    : 'flex justify-between gap-4';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3 text-sm'}>
      <div className={rowClass}>
        <dt className="text-stone-500">Original Amount</dt>
        <dd><OriginalAmount amount={originalAmount} /></dd>
      </div>
      {showLines && (
        <>
          <div className={rowClass}>
            <dt className="text-stone-500">Bonus Amount</dt>
            <dd><BonusAmount amount={bonusAmount} /></dd>
          </div>
          <div className={rowClass}>
            <dt className="text-stone-500">Deduction Amount</dt>
            <dd><DeductionAmount amount={deductionAmount} /></dd>
          </div>
          <div className={`${rowClass} border-t border-stone-100 pt-2`}>
            <dt className="font-medium text-stone-700" title={NET_AMOUNT_TOOLTIP}>
              Net Amount
            </dt>
            <dd><NetAmount amount={netAmount} showTooltip={!compact} /></dd>
          </div>
          {!compact && (
            <p className="text-xs text-stone-500">{NET_AMOUNT_TOOLTIP}</p>
          )}
        </>
      )}
      {showReason && production.adjustmentReason && (
        <div className="rounded-lg bg-stone-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Reason</dt>
          <dd className="mt-1 text-stone-700">{production.adjustmentReason}</dd>
        </div>
      )}
    </div>
  );
}
