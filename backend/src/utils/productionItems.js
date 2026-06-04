import mongoose from 'mongoose';
import { PRODUCTION_ITEM_TYPE, PRODUCTION_METHOD } from '../config/constants.js';
import { createError } from '../middleware/errorHandler.js';

export function sumKgByMethod(items) {
  let dryMachineKg = 0;
  let nonMachineKg = 0;
  for (const item of items) {
    const kg = Number(item.kg) || 0;
    if (item.method === PRODUCTION_METHOD.DRY) dryMachineKg += kg;
    else if (item.method === PRODUCTION_METHOD.NON) nonMachineKg += kg;
  }
  return { dryMachineKg, nonMachineKg };
}

export function methodLabel(method) {
  return method === PRODUCTION_METHOD.DRY ? 'Dry Machine' : 'Non-Machine';
}

export function typeLabel(type) {
  return type === PRODUCTION_ITEM_TYPE.SPECIAL ? 'Special' : 'Normal';
}

export async function validateAndNormalizeItems(rawItems, { GramType, QualityType }) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createError(400, 'Add at least one production row');
  }

  const [gramTypes, qualityTypes] = await Promise.all([
    GramType.find({ active: true }).lean(),
    QualityType.find({ active: true }).lean(),
  ]);

  const gramMap = new Map(gramTypes.map((g) => [g._id.toString(), g]));
  const qualityMap = new Map(qualityTypes.map((q) => [q._id.toString(), q]));

  const items = [];

  for (let i = 0; i < rawItems.length; i++) {
    const row = rawItems[i];
    const rowNum = i + 1;
    const type = row.type;
    const method = row.method;
    const kg = Number(row.kg);

    if (!type || !Object.values(PRODUCTION_ITEM_TYPE).includes(type)) {
      throw createError(400, `Row ${rowNum}: invalid production type`);
    }
    if (!method || !Object.values(PRODUCTION_METHOD).includes(method)) {
      throw createError(400, `Row ${rowNum}: invalid production method`);
    }
    if (!kg || kg <= 0) {
      throw createError(400, `Row ${rowNum}: KG must be greater than 0`);
    }

    const item = { type, method, kg, gramTypeId: null, qualityTypeId: null, specialType: '' };

    if (type === PRODUCTION_ITEM_TYPE.NORMAL) {
      if (!row.gramTypeId) throw createError(400, `Row ${rowNum}: gram type is required`);
      if (!row.qualityTypeId) throw createError(400, `Row ${rowNum}: quality type is required`);
      const gramId = row.gramTypeId.toString();
      const qualityId = row.qualityTypeId.toString();
      if (!gramMap.has(gramId)) throw createError(400, `Row ${rowNum}: invalid or inactive gram type`);
      if (!qualityMap.has(qualityId)) {
        throw createError(400, `Row ${rowNum}: invalid or inactive quality type`);
      }
      item.gramTypeId = new mongoose.Types.ObjectId(gramId);
      item.qualityTypeId = new mongoose.Types.ObjectId(qualityId);
    } else {
      const specialType = (row.specialType || '').trim();
      if (!specialType) throw createError(400, `Row ${rowNum}: special type is required`);
      item.specialType = specialType;
    }

    items.push(item);
  }

  return { items, gramMap, qualityMap };
}

export function legacyItemsFromProduction(doc) {
  const items = [];
  const dry = doc.dryMachineKg || 0;
  const non = doc.nonMachineKg || 0;
  if (dry > 0) {
    items.push({
      type: PRODUCTION_ITEM_TYPE.NORMAL,
      method: PRODUCTION_METHOD.DRY,
      gramTypeId: null,
      qualityTypeId: null,
      specialType: '',
      kg: dry,
      gramLabel: '—',
      qualityLabel: '—',
    });
  }
  if (non > 0) {
    items.push({
      type: PRODUCTION_ITEM_TYPE.NORMAL,
      method: PRODUCTION_METHOD.NON,
      gramTypeId: null,
      qualityTypeId: null,
      specialType: '',
      kg: non,
      gramLabel: '—',
      qualityLabel: '—',
    });
  }
  return items;
}

export function formatItemsForResponse(docItems, gramMap, qualityMap) {
  if (!docItems?.length) return [];
  return docItems.map((item) => {
    const gramId = item.gramTypeId?.toString();
    const qualityId = item.qualityTypeId?.toString();
    return {
      id: item._id?.toString(),
      type: item.type,
      method: item.method,
      methodLabel: methodLabel(item.method),
      typeLabel: typeLabel(item.type),
      gramTypeId: gramId || null,
      qualityTypeId: qualityId || null,
      gramLabel: gramId && gramMap?.get(gramId)?.name ? gramMap.get(gramId).name : '—',
      qualityLabel:
        qualityId && qualityMap?.get(qualityId)?.name ? qualityMap.get(qualityId).name : '—',
      specialType: item.specialType || '',
      kg: item.kg,
    };
  });
}

export function expandProductionToReportRows(productions, gramMap, qualityMap) {
  const rows = [];
  for (const p of productions) {
    const base = {
      productionId: p.id,
      date: p.date,
      employeeId: p.employeeId,
      employeeName: p.employeeName,
      status: p.status,
      originalAmount: p.originalAmount,
      bonusAmount: p.bonusAmount,
      deductionAmount: p.deductionAmount,
      netAmount: p.netAmount,
    };
    const items = p.items?.length ? p.items : legacyItemsFromProduction(p);
    for (const item of items) {
      rows.push({
        ...base,
        itemId: item.id,
        productionType: item.typeLabel || typeLabel(item.type),
        gram: item.type === PRODUCTION_ITEM_TYPE.SPECIAL ? '—' : item.gramLabel || '—',
        quality: item.type === PRODUCTION_ITEM_TYPE.SPECIAL ? '—' : item.qualityLabel || '—',
        specialType: item.specialType || '—',
        method: item.methodLabel || methodLabel(item.method),
        kg: item.kg,
      });
    }
  }
  return rows;
}
