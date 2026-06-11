import { validationResult } from 'express-validator';
import { getRates, updateRates } from '../services/settingsService.js';
import { logAction } from '../services/activityLogService.js';

export async function getSettings(req, res, next) {
  try {
    const rates = await getRates();
    res.json(rates);
  } catch (err) {
    next(err);
  }
}

export async function putSettings(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { dryMachineRate, nonMachineRate } = req.body;
    const rates = await updateRates(dryMachineRate, nonMachineRate);
    
    // Log settings change
    await logAction(req.user, {
      action: 'Settings changed',
      description: `Updated rates to: Dry Machine Rate = ${dryMachineRate} INR, Non-Machine Rate = ${nonMachineRate} INR`,
      targetType: 'Settings',
    });

    res.json(rates);
  } catch (err) {
    next(err);
  }
}
