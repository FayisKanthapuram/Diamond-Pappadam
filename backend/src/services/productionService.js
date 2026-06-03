import mongoose from 'mongoose';
import { Production } from '../models/Production.js';
import { getRates } from './settingsService.js';
import {
  buildProductionFromRates,
  recalculateFromStoredRates,
  calculateNetAmount,
} from '../utils/calculations.js';
import { startOfDay } from '../utils/dates.js';
import { createError } from '../middleware/errorHandler.js';
import { PRODUCTION_STATUS } from '../config/constants.js';

function pendingStatusQuery() {
  return { $in: [PRODUCTION_STATUS.PENDING, null] };
}

export function formatProduction(doc) {
  const emp = doc.employeeId;
  const createdBy = doc.createdBy;
  const approvedBy = doc.approvedBy;
  const adjustedBy = doc.adjustedBy;
  const originalAmount = doc.totalAmount ?? 0;
  const bonusAmount = doc.bonusAmount ?? 0;
  const deductionAmount = doc.deductionAmount ?? 0;
  const netAmount =
    doc.netAmount != null
      ? doc.netAmount
      : calculateNetAmount(originalAmount, bonusAmount, deductionAmount);

  return {
    id: doc._id.toString(),
    employeeId: emp?._id?.toString() || doc.employeeId?.toString(),
    employeeName: emp?.name || undefined,
    date: doc.date,
    dryMachineKg: doc.dryMachineKg,
    nonMachineKg: doc.nonMachineKg,
    dryMachineRate: doc.dryMachineRate,
    nonMachineRate: doc.nonMachineRate,
    dryMachineAmount: doc.dryMachineAmount,
    nonMachineAmount: doc.nonMachineAmount,
    totalAmount: originalAmount,
    originalAmount,
    bonusAmount,
    deductionAmount,
    adjustmentReason: doc.adjustmentReason || '',
    netAmount,
    totalKg: doc.dryMachineKg + doc.nonMachineKg,
    notes: doc.notes || '',
    status: doc.status || PRODUCTION_STATUS.PENDING,
    approvedBy: approvedBy?._id?.toString() || doc.approvedBy?.toString() || null,
    approvedByName: approvedBy?.name || undefined,
    approvedAt: doc.approvedAt || null,
    adjustedBy: adjustedBy?._id?.toString() || doc.adjustedBy?.toString() || null,
    adjustedByName: adjustedBy?.name || undefined,
    adjustedAt: doc.adjustedAt || null,
    rejectionReason: doc.rejectionReason || '',
    createdBy: createdBy?._id?.toString() || doc.createdBy?.toString(),
    createdByName: createdBy?.name,
    canEdit: doc.canEdit,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function attachCanEdit(productions, { isAdmin, userId }) {
  return productions.map((p) => {
    const doc = p.toObject ? p.toObject() : { ...p };
    const status = doc.status || PRODUCTION_STATUS.PENDING;
    if (isAdmin) {
      doc.canEdit = true;
    } else {
      const empId = (doc.employeeId?._id || doc.employeeId)?.toString();
      const isOwner = empId === userId;
      doc.canEdit =
        isOwner &&
        (status === PRODUCTION_STATUS.PENDING || status === PRODUCTION_STATUS.REJECTED);
    }
    return formatProduction(doc);
  });
}

function resetApprovalFields(production) {
  production.status = PRODUCTION_STATUS.PENDING;
  production.approvedBy = null;
  production.approvedAt = null;
  production.rejectionReason = '';
  production.bonusAmount = 0;
  production.deductionAmount = 0;
  production.adjustmentReason = '';
  production.netAmount = production.totalAmount;
  production.adjustedBy = null;
  production.adjustedAt = null;
}

export async function createProductionEntry({ employeeId, createdBy, date, dryMachineKg, nonMachineKg, notes }) {
  if (dryMachineKg === 0 && nonMachineKg === 0) {
    throw createError(400, 'Enter at least some production quantity');
  }

  const rates = await getRates();
  const snapshot = buildProductionFromRates(dryMachineKg, nonMachineKg, rates);

  const production = await Production.create({
    employeeId,
    createdBy,
    date: startOfDay(date),
    dryMachineKg,
    nonMachineKg,
    notes: notes || '',
    status: PRODUCTION_STATUS.PENDING,
    bonusAmount: 0,
    deductionAmount: 0,
    adjustmentReason: '',
    netAmount: snapshot.totalAmount,
    ...snapshot,
  });

  return formatProduction(production);
}

export async function updateProductionEntry(id, user, payload) {
  const production = await Production.findById(id)
    .populate('employeeId', 'name phone')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name');
  if (!production) throw createError(404, 'Production entry not found');

  const isAdmin = user.role === 'admin';
  const status = production.status || PRODUCTION_STATUS.PENDING;

  if (!isAdmin) {
    const ownerId = (production.employeeId._id || production.employeeId).toString();
    if (ownerId !== user.id) {
      throw createError(403, 'You can only edit your own production');
    }
    if (status === PRODUCTION_STATUS.APPROVED) {
      throw createError(403, 'Approved production cannot be edited');
    }
    if (status !== PRODUCTION_STATUS.PENDING && status !== PRODUCTION_STATUS.REJECTED) {
      throw createError(403, 'This production entry cannot be edited');
    }
  }

  const dryMachineKg = payload.dryMachineKg ?? production.dryMachineKg;
  const nonMachineKg = payload.nonMachineKg ?? production.nonMachineKg;

  if (dryMachineKg === 0 && nonMachineKg === 0) {
    throw createError(400, 'Enter at least some production quantity');
  }

  let rates = {
    dryMachineRate: production.dryMachineRate,
    nonMachineRate: production.nonMachineRate,
  };

  if (!production.dryMachineRate && !production.nonMachineRate) {
    const current = await getRates();
    rates = { dryMachineRate: current.dryMachineRate, nonMachineRate: current.nonMachineRate };
    production.dryMachineRate = rates.dryMachineRate;
    production.nonMachineRate = rates.nonMachineRate;
  }

  const amounts = recalculateFromStoredRates(dryMachineKg, nonMachineKg, rates);

  production.dryMachineKg = dryMachineKg;
  production.nonMachineKg = nonMachineKg;
  production.dryMachineAmount = amounts.dryMachineAmount;
  production.nonMachineAmount = amounts.nonMachineAmount;
  production.totalAmount = amounts.totalAmount;
  if (payload.date !== undefined) production.date = startOfDay(payload.date);
  if (payload.notes !== undefined) production.notes = payload.notes;

  if (isAdmin && status === PRODUCTION_STATUS.APPROVED) {
    resetApprovalFields(production);
  } else if (!isAdmin && status === PRODUCTION_STATUS.REJECTED) {
    resetApprovalFields(production);
  } else {
    production.netAmount = production.totalAmount;
  }

  await production.save();
  await production.populate('approvedBy', 'name');
  return formatProduction(production);
}

export async function approveProductionEntry(
  id,
  adminUserId,
  { bonusAmount = 0, deductionAmount = 0, adjustmentReason = '' } = {}
) {
  const production = await Production.findById(id)
    .populate('employeeId', 'name phone')
    .populate('createdBy', 'name');
  if (!production) throw createError(404, 'Production entry not found');

  const currentStatus = production.status || PRODUCTION_STATUS.PENDING;
  if (currentStatus !== PRODUCTION_STATUS.PENDING) {
    throw createError(400, 'Only pending production can be approved');
  }

  const bonus = Math.max(0, Number(bonusAmount) || 0);
  const deduction = Math.max(0, Number(deductionAmount) || 0);
  const reason = (adjustmentReason || '').trim();

  if ((bonus > 0 || deduction > 0) && !reason) {
    throw createError(400, 'Adjustment reason is required when bonus or deduction is applied');
  }

  const netAmount = calculateNetAmount(production.totalAmount, bonus, deduction);
  if (netAmount < 0) {
    throw createError(400, 'Net amount cannot be negative');
  }

  const now = new Date();
  production.status = PRODUCTION_STATUS.APPROVED;
  production.approvedBy = adminUserId;
  production.approvedAt = now;
  production.rejectionReason = '';
  production.bonusAmount = bonus;
  production.deductionAmount = deduction;
  production.adjustmentReason = reason;
  production.netAmount = netAmount;
  production.adjustedBy = adminUserId;
  production.adjustedAt = now;

  await production.save();
  await production.populate(['approvedBy', 'adjustedBy'], 'name');
  return formatProduction(production);
}

export async function rejectProductionEntry(id, adminUserId, rejectionReason) {
  const production = await Production.findById(id)
    .populate('employeeId', 'name phone')
    .populate('createdBy', 'name');
  if (!production) throw createError(404, 'Production entry not found');

  const currentStatus = production.status || PRODUCTION_STATUS.PENDING;
  if (currentStatus !== PRODUCTION_STATUS.PENDING) {
    throw createError(400, 'Only pending production can be rejected');
  }

  production.status = PRODUCTION_STATUS.REJECTED;
  production.approvedBy = null;
  production.approvedAt = null;
  production.rejectionReason = rejectionReason.trim();

  await production.save();
  return formatProduction(production);
}

export async function deleteProductionEntry(id, user) {
  const production = await Production.findById(id);
  if (!production) throw createError(404, 'Production entry not found');

  if (user.role !== 'admin') {
    throw createError(403, 'Only admin can delete production entries');
  }

  await production.deleteOne();
  return { message: 'Production entry deleted' };
}

export async function listProductionEntries(filters, { isAdmin, userId }) {
  const query = {};
  if (filters.employeeId) query.employeeId = filters.employeeId;
  if (!isAdmin) query.employeeId = new mongoose.Types.ObjectId(userId);

  if (filters.status) {
    query.status =
      filters.status === PRODUCTION_STATUS.PENDING ? pendingStatusQuery() : filters.status;
  }
  if (filters.approvedOnly) query.status = PRODUCTION_STATUS.APPROVED;

  if (filters.from || filters.to) {
    query.date = {};
    if (filters.from) query.date.$gte = startOfDay(filters.from);
    if (filters.to) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const productions = await Production.find(query)
    .populate('employeeId', 'name phone')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('adjustedBy', 'name')
    .sort({ date: -1, createdAt: -1 });

  return attachCanEdit(productions, { isAdmin, userId });
}

export async function getRecentEntries(employeeId, limit = 5) {
  const productions = await Production.find({ employeeId })
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('adjustedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);

  return attachCanEdit(productions, { isAdmin: false, userId: employeeId.toString() });
}

export async function countByStatus(match = {}) {
  const result = await Production.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ['$status', PRODUCTION_STATUS.PENDING] },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of result) {
    const key = row._id || PRODUCTION_STATUS.PENDING;
    if (counts[key] !== undefined) counts[key] = row.count;
  }
  return counts;
}

export async function countPendingApprovals() {
  return Production.countDocuments({ status: pendingStatusQuery() });
}
