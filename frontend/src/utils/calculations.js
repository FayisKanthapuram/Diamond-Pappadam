/** Original amount + bonus − deduction (matches backend). */
export function calculateNetAmount(originalAmount, bonusAmount = 0, deductionAmount = 0) {
  const bonus = Number(bonusAmount) || 0;
  const deduction = Number(deductionAmount) || 0;
  const original = Number(originalAmount) || 0;
  return Math.round((original + bonus - deduction) * 100) / 100;
}
