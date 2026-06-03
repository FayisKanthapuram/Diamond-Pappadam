import { formatCurrency } from '../utils/format.js';

export const NET_AMOUNT_TOOLTIP =
  'Net Amount = Original Amount + Bonus Amount − Deduction Amount';

export function OriginalAmount({ amount, className = '' }) {
  return <span className={className}>{formatCurrency(amount ?? 0)}</span>;
}

export function BonusAmount({ amount, className = '' }) {
  return (
    <span className={`font-medium text-emerald-700 ${className}`}>
      +{formatCurrency(amount ?? 0)}
    </span>
  );
}

export function DeductionAmount({ amount, className = '' }) {
  return (
    <span className={`font-medium text-red-700 ${className}`}>
      −{formatCurrency(amount ?? 0)}
    </span>
  );
}

export function NetAmount({ amount, className = '', showTooltip = false }) {
  const content = (
    <span className={`font-semibold text-brand-700 ${className}`}>
      {formatCurrency(amount ?? 0)}
    </span>
  );

  if (!showTooltip) return content;

  return (
    <span className="inline-flex items-center gap-1" title={NET_AMOUNT_TOOLTIP}>
      {content}
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600"
        aria-label={NET_AMOUNT_TOOLTIP}
      >
        ?
      </span>
    </span>
  );
}

export function NetAmountHeader() {
  return (
    <span className="inline-flex items-center gap-1" title={NET_AMOUNT_TOOLTIP}>
      Net Amount
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-500"
        aria-label={NET_AMOUNT_TOOLTIP}
      >
        ?
      </span>
    </span>
  );
}

export function getPaymentAmounts(production) {
  const originalAmount = production?.originalAmount ?? production?.totalAmount ?? 0;
  const bonusAmount = production?.bonusAmount ?? 0;
  const deductionAmount = production?.deductionAmount ?? 0;
  const netAmount =
    production?.netAmount != null
      ? production.netAmount
      : originalAmount + bonusAmount - deductionAmount;
  return { originalAmount, bonusAmount, deductionAmount, netAmount };
}
