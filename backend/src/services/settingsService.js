import { Settings } from '../models/Settings.js';
import { createError } from '../middleware/errorHandler.js';

const RATES_KEY = 'rates';

export async function getRates() {
  const settings = await Settings.findOne({ key: RATES_KEY });
  if (!settings) {
    throw createError(500, 'Production rates not configured. Run seed script.');
  }
  return {
    dryMachineRate: settings.dryMachineRate,
    nonMachineRate: settings.nonMachineRate,
  };
}

export async function updateRates(dryMachineRate, nonMachineRate) {
  const settings = await Settings.findOneAndUpdate(
    { key: RATES_KEY },
    { dryMachineRate, nonMachineRate },
    { new: true, upsert: true, runValidators: true }
  );
  return {
    dryMachineRate: settings.dryMachineRate,
    nonMachineRate: settings.nonMachineRate,
  };
}
