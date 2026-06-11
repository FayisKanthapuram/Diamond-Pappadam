import mongoose from 'mongoose';
import { Production } from '../models/Production.js';
import { GramType } from '../models/GramType.js';
import { QualityType } from '../models/QualityType.js';
import { getRates } from './settingsService.js';
import { buildProductionFromRates, calculateNetAmount } from '../utils/calculations.js';
import { startOfDay } from '../utils/dates.js';
import { createError } from '../middleware/errorHandler.js';
import { PRODUCTION_STATUS } from '../config/constants.js';
import {
  sumKgByMethod,
  validateAndNormalizeItems,
  formatItemsForResponse,
  legacyItemsFromProduction,
  expandProductionToReportRows,
} from '../utils/productionItems.js';

function pendingStatusQuery() {
  return { $in: [PRODUCTION_STATUS.PENDING, null] };
}

async function loadLookupMaps() {
  const [grams, qualities] = await Promise.all([
    GramType.find().lean(),
    QualityType.find().lean(),
  ]);
  return {
    gramMap: new Map(grams.map((g) => [g._id.toString(), g])),
    qualityMap: new Map(qualities.map((q) => [q._id.toString(), q])),
  };
}

export function formatProduction(doc, lookup = null) {
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

  const gramMap = lookup?.gramMap;
  const qualityMap = lookup?.qualityMap;
  const items =
    doc.items?.length > 0
      ? formatItemsForResponse(doc.items, gramMap, qualityMap)
      : legacyItemsFromProduction(doc);

  return {
    id: doc._id.toString(),
    employeeId: emp?._id?.toString() || doc.employeeId?.toString(),
    employeeName: emp?.name || undefined,
    date: doc.date,
    items,
    dryMachineKg: doc.dryMachineKg ?? 0,
    nonMachineKg: doc.nonMachineKg ?? 0,
    totalDryKg: doc.dryMachineKg ?? 0,
    totalNonMachineKg: doc.nonMachineKg ?? 0,
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
    totalKg: (doc.dryMachineKg ?? 0) + (doc.nonMachineKg ?? 0),
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

function attachCanEdit(productions, { isAdmin, userId }, lookup) {
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
    return formatProduction(doc, lookup);
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

async function applyItemsToProduction(production, rawItems) {
  const { items } = await validateAndNormalizeItems(rawItems, {
    GramType,
    QualityType,
  });
  const { dryMachineKg, nonMachineKg } = sumKgByMethod(items);
  if (dryMachineKg === 0 && nonMachineKg === 0) {
    throw createError(400, 'Enter at least some production quantity');
  }

  const rates = await getRates();
  const snapshot = buildProductionFromRates(dryMachineKg, nonMachineKg, rates);

  production.items = items;
  production.dryMachineKg = dryMachineKg;
  production.nonMachineKg = nonMachineKg;
  production.dryMachineRate = snapshot.dryMachineRate;
  production.nonMachineRate = snapshot.nonMachineRate;
  production.dryMachineAmount = snapshot.dryMachineAmount;
  production.nonMachineAmount = snapshot.nonMachineAmount;
  production.totalAmount = snapshot.totalAmount;

  return snapshot;
}

export async function createProductionEntry({ employeeId, createdBy, date, items, notes }) {
  const production = new Production({
    employeeId,
    createdBy,
    date: startOfDay(date),
    notes: notes || '',
    status: PRODUCTION_STATUS.PENDING,
    bonusAmount: 0,
    deductionAmount: 0,
    adjustmentReason: '',
  });

  const snapshot = await applyItemsToProduction(production, items);
  production.netAmount = snapshot.totalAmount;
  await production.save();

  const lookup = await loadLookupMaps();
  return formatProduction(production, lookup);
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

  if (payload.items) {
    await applyItemsToProduction(production, payload.items);
  }

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
  const lookup = await loadLookupMaps();
  return formatProduction(production, lookup);
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
  const lookup = await loadLookupMaps();
  return formatProduction(production, lookup);
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
  const lookup = await loadLookupMaps();
  return formatProduction(production, lookup);
}

export async function deleteProductionEntry(id, user) {
  const production = await Production.findById(id);
  if (!production) throw createError(404, 'Production entry not found');

  if (user.role !== 'admin') {
    throw createError(403, 'Only admin can delete production entries');
  }

  await production.deleteOne();
  return production;
}

export async function revertProductionEntry(id, adminUserId) {
  const production = await Production.findById(id)
    .populate('employeeId', 'name phone')
    .populate('createdBy', 'name');
  if (!production) throw createError(404, 'Production entry not found');

  const currentStatus = production.status || PRODUCTION_STATUS.PENDING;
  if (currentStatus === PRODUCTION_STATUS.PENDING) {
    throw createError(400, 'Production is already pending');
  }

  production.status = PRODUCTION_STATUS.PENDING;
  production.approvedBy = null;
  production.approvedAt = null;
  production.bonusAmount = 0;
  production.deductionAmount = 0;
  production.adjustmentReason = '';
  production.netAmount = 0;
  production.adjustedBy = null;
  production.adjustedAt = null;
  production.rejectionReason = '';

  await production.save();
  const lookup = await loadLookupMaps();
  return formatProduction(production, lookup);
}

function buildListQuery(filters, { isAdmin, userId }) {
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

  const itemFilters = [];
  if (filters.gramTypeId) itemFilters.push({ gramTypeId: new mongoose.Types.ObjectId(filters.gramTypeId) });
  if (filters.qualityTypeId) {
    itemFilters.push({ qualityTypeId: new mongoose.Types.ObjectId(filters.qualityTypeId) });
  }
  if (filters.method) itemFilters.push({ method: filters.method });

  if (itemFilters.length === 1) {
    query.items = { $elemMatch: itemFilters[0] };
  } else if (itemFilters.length > 1) {
    query.items = { $elemMatch: { $and: itemFilters } };
  }

  return query;
}

export async function listProductionEntries(filters, { isAdmin, userId }) {
  const query = buildListQuery(filters, { isAdmin, userId });

  const productions = await Production.find(query)
    .populate('employeeId', 'name phone')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('adjustedBy', 'name')
    .sort({ date: -1, createdAt: -1 });

  const lookup = await loadLookupMaps();
  return attachCanEdit(productions, { isAdmin, userId }, lookup);
}

export async function listProductionReportRows(filters, { userId }) {
  const productions = await listProductionEntries(
    { ...filters, approvedOnly: true },
    { isAdmin: true, userId }
  );
  const lookup = await loadLookupMaps();
  return expandProductionToReportRows(productions, lookup.gramMap, lookup.qualityMap);
}

export async function getRecentEntries(employeeId, limit = 5) {
  const productions = await Production.find({ employeeId })
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('adjustedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);

  const lookup = await loadLookupMaps();
  return attachCanEdit(productions, { isAdmin: false, userId: employeeId.toString() }, lookup);
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
