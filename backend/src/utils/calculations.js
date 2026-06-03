/** Build amounts and rate snapshot from current settings (used on create only). */
export function buildProductionFromRates(dryMachineKg, nonMachineKg, rates) {
  const dryMachineRate = rates.dryMachineRate;
  const nonMachineRate = rates.nonMachineRate;
  const dryMachineAmount = dryMachineKg * dryMachineRate;
  const nonMachineAmount = nonMachineKg * nonMachineRate;
  const totalAmount = dryMachineAmount + nonMachineAmount;
  return {
    dryMachineRate,
    nonMachineRate,
    dryMachineAmount,
    nonMachineAmount,
    totalAmount,
  };
}

/** Recalculate amounts using rates stored on the record (used on edit — never current rates). */
export function recalculateFromStoredRates(dryMachineKg, nonMachineKg, stored) {
  const dryMachineAmount = dryMachineKg * stored.dryMachineRate;
  const nonMachineAmount = nonMachineKg * stored.nonMachineRate;
  return {
    dryMachineAmount,
    nonMachineAmount,
    totalAmount: dryMachineAmount + nonMachineAmount,
  };
}

/** Original amount (dry + non-machine) + bonus − deduction. */
export function calculateNetAmount(originalAmount, bonusAmount = 0, deductionAmount = 0) {
  const bonus = Number(bonusAmount) || 0;
  const deduction = Number(deductionAmount) || 0;
  const original = Number(originalAmount) || 0;
  return Math.round((original + bonus - deduction) * 100) / 100;
}
