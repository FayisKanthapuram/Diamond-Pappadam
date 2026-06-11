import { validationResult } from 'express-validator';
import {
  createProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
  revertProductionEntry,
  listProductionEntries,
  listProductionReportRows,
  approveProductionEntry,
  rejectProductionEntry,
} from '../services/productionService.js';
import { startOfMonth, endOfMonth } from '../utils/dates.js';
import { Production } from '../models/Production.js';
import { PRODUCTION_STATUS } from '../config/constants.js';
import { logAction } from '../services/activityLogService.js';
import mongoose from 'mongoose';

export async function createProduction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { date, items, notes } = req.body;
    const production = await createProductionEntry({
      employeeId: req.user.id,
      createdBy: req.user.id,
      date,
      items,
      notes,
    });

    // Log production submission
    await logAction(req.user, {
      action: 'Production submitted',
      description: `Submitted production entry of ${production.totalKg} kg for date ${new Date(production.date).toLocaleDateString()}`,
      targetType: 'Production',
      targetId: production.id,
    });

    res.status(201).json({ production });
  } catch (err) {
    next(err);
  }
}

export async function updateProduction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { date, items, notes } = req.body;
    const production = await updateProductionEntry(req.params.id, req.user, {
      date,
      items,
      notes,
    });

    // Log production edit
    await logAction(req.user, {
      action: 'Production edited',
      description: `Edited production entry of ${production.employeeName || 'employee'} (new weight: ${production.totalKg} kg)`,
      targetType: 'Production',
      targetId: production.id,
    });

    res.json({ production });
  } catch (err) {
    next(err);
  }
}

export async function approveProduction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { bonusAmount = 0, deductionAmount = 0, adjustmentReason = '' } = req.body;
    const production = await approveProductionEntry(req.params.id, req.user.id, {
      bonusAmount,
      deductionAmount,
      adjustmentReason,
    });

    // Log approval
    await logAction(req.user, {
      action: 'Production approved',
      description: `Approved production entry of ${production.employeeName || 'employee'} for date ${new Date(production.date).toLocaleDateString()}`,
      targetType: 'Production',
      targetId: production.id,
    });

    // Log bonus if added
    if (bonusAmount > 0) {
      await logAction(req.user, {
        action: 'Bonus added',
        description: `Added bonus of ${bonusAmount} INR to production of ${production.employeeName || 'employee'}. Reason: ${adjustmentReason}`,
        targetType: 'Production',
        targetId: production.id,
      });
    }

    // Log deduction if added
    if (deductionAmount > 0) {
      await logAction(req.user, {
        action: 'Deduction added',
        description: `Added deduction of ${deductionAmount} INR to production of ${production.employeeName || 'employee'}. Reason: ${adjustmentReason}`,
        targetType: 'Production',
        targetId: production.id,
      });
    }

    res.json({ production });
  } catch (err) {
    next(err);
  }
}

export async function rejectProduction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const production = await rejectProductionEntry(
      req.params.id,
      req.user.id,
      req.body.rejectionReason
    );

    // Log rejection
    await logAction(req.user, {
      action: 'Production rejected',
      description: `Rejected production entry of ${production.employeeName || 'employee'}. Reason: ${req.body.rejectionReason}`,
      targetType: 'Production',
      targetId: production.id,
    });

    res.json({ production });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduction(req, res, next) {
  try {
    const production = await deleteProductionEntry(req.params.id, req.user);

    // Log deletion
    await logAction(req.user, {
      action: 'Production deleted',
      description: `Deleted production entry of ${production.employeeName || 'employee'} for date ${new Date(production.date).toLocaleDateString()}.`,
      targetType: 'Production',
      targetId: production.id,
    });

    res.json({ message: 'Production entry deleted' });
  } catch (err) {
    next(err);
  }
}

export async function revertProduction(req, res, next) {
  try {
    const production = await revertProductionEntry(req.params.id, req.user.id);

    // Log reversion
    await logAction(req.user, {
      action: 'Production reverted to pending',
      description: `Reverted production entry of ${production.employeeName || 'employee'} for date ${new Date(production.date).toLocaleDateString()} back to pending.`,
      targetType: 'Production',
      targetId: production.id,
    });

    res.json({ production });
  } catch (err) {
    next(err);
  }
}

export async function getMyProductions(req, res, next) {
  try {
    const productions = await listProductionEntries(
      { from: req.query.from, to: req.query.to, status: req.query.status },
      { isAdmin: false, userId: req.user.id }
    );
    res.json({ productions });
  } catch (err) {
    next(err);
  }
}

export async function listProductions(req, res, next) {
  try {
    const productions = await listProductionEntries(
      {
        employeeId: req.query.employeeId,
        from: req.query.from,
        to: req.query.to,
        status: req.query.status,
        gramTypeId: req.query.gramTypeId,
        qualityTypeId: req.query.qualityTypeId,
        method: req.query.method,
      },
      { isAdmin: true, userId: req.user.id }
    );
    res.json({ productions });
  } catch (err) {
    next(err);
  }
}

export async function listPendingProductions(req, res, next) {
  try {
    const productions = await listProductionEntries(
      { status: PRODUCTION_STATUS.PENDING },
      { isAdmin: true, userId: req.user.id }
    );
    res.json({ productions });
  } catch (err) {
    next(err);
  }
}

export async function getProductionReport(req, res, next) {
  try {
    const rows = await listProductionReportRows(
      {
        employeeId: req.query.employeeId,
        from: req.query.from,
        to: req.query.to,
        gramTypeId: req.query.gramTypeId,
        qualityTypeId: req.query.qualityTypeId,
        method: req.query.method,
      },
      { userId: req.user.id }
    );
    res.json({ rows });
  } catch (err) {
    next(err);
  }
}

export async function getMyEarnings(req, res, next) {
  try {
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const monthStart = startOfMonth(year, month);
    const monthEnd = endOfMonth(year, month);

    const result = await Production.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: monthStart, $lte: monthEnd },
          status: PRODUCTION_STATUS.APPROVED,
        },
      },
      {
        $group: {
          _id: null,
          dryMachineKg: { $sum: '$dryMachineKg' },
          nonMachineKg: { $sum: '$nonMachineKg' },
          dryMachineAmount: { $sum: '$dryMachineAmount' },
          nonMachineAmount: { $sum: '$nonMachineAmount' },
          originalAmount: { $sum: '$totalAmount' },
          bonusAmount: { $sum: { $ifNull: ['$bonusAmount', 0] } },
          deductionAmount: { $sum: { $ifNull: ['$deductionAmount', 0] } },
          netEarnings: { $sum: { $ifNull: ['$netAmount', '$totalAmount'] } },
          entryCount: { $sum: 1 },
        },
      },
    ]);

    const data = result[0] || {
      dryMachineKg: 0,
      nonMachineKg: 0,
      dryMachineAmount: 0,
      nonMachineAmount: 0,
      originalAmount: 0,
      bonusAmount: 0,
      deductionAmount: 0,
      netEarnings: 0,
      entryCount: 0,
    };

    res.json({
      month,
      year,
      dryMachineKg: data.dryMachineKg,
      nonMachineKg: data.nonMachineKg,
      totalKg: data.dryMachineKg + data.nonMachineKg,
      dryMachineAmount: data.dryMachineAmount,
      nonMachineAmount: data.nonMachineAmount,
      originalAmount: data.originalAmount,
      bonusAmount: data.bonusAmount,
      deductionAmount: data.deductionAmount,
      totalEarnings: data.netEarnings,
      entryCount: data.entryCount,
    });
  } catch (err) {
    next(err);
  }
}
