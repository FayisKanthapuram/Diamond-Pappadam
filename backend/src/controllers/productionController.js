import { validationResult } from 'express-validator';
import {
  createProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
  listProductionEntries,
  approveProductionEntry,
  rejectProductionEntry,
} from '../services/productionService.js';
import { startOfMonth, endOfMonth } from '../utils/dates.js';
import { Production } from '../models/Production.js';
import { PRODUCTION_STATUS } from '../config/constants.js';
import mongoose from 'mongoose';

export async function createProduction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { date, dryMachineKg = 0, nonMachineKg = 0, notes } = req.body;
    const production = await createProductionEntry({
      employeeId: req.user.id,
      createdBy: req.user.id,
      date,
      dryMachineKg: Number(dryMachineKg),
      nonMachineKg: Number(nonMachineKg),
      notes,
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

    const { date, dryMachineKg, nonMachineKg, notes } = req.body;
    const production = await updateProductionEntry(req.params.id, req.user, {
      date,
      dryMachineKg: dryMachineKg !== undefined ? Number(dryMachineKg) : undefined,
      nonMachineKg: nonMachineKg !== undefined ? Number(nonMachineKg) : undefined,
      notes,
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
    res.json({ production });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduction(req, res, next) {
  try {
    const result = await deleteProductionEntry(req.params.id, req.user);
    res.json(result);
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
    const productions = await listProductionEntries(
      {
        employeeId: req.query.employeeId,
        from: req.query.from,
        to: req.query.to,
        approvedOnly: true,
      },
      { isAdmin: true, userId: req.user.id }
    );
    res.json({ productions });
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
