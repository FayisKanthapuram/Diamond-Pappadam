import { QualityType } from '../models/QualityType.js';
import { createError } from '../middleware/errorHandler.js';

function formatQualityType(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    active: doc.active,
    sortOrder: doc.sortOrder ?? 0,
  };
}

export async function listQualityTypes({ activeOnly = false } = {}) {
  const query = activeOnly ? { active: true } : {};
  const types = await QualityType.find(query).sort({ sortOrder: 1, name: 1 });
  return types.map(formatQualityType);
}

export async function createQualityType({ name }) {
  const trimmed = name.trim();
  if (!trimmed) throw createError(400, 'Name is required');
  const existing = await QualityType.findOne({ name: trimmed });
  if (existing) throw createError(400, 'Quality type already exists');
  const doc = await QualityType.create({ name: trimmed, active: true });
  return formatQualityType(doc);
}

export async function updateQualityType(id, { name, active }) {
  const doc = await QualityType.findById(id);
  if (!doc) throw createError(404, 'Quality type not found');
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) throw createError(400, 'Name is required');
    const existing = await QualityType.findOne({ name: trimmed, _id: { $ne: id } });
    if (existing) throw createError(400, 'Quality type already exists');
    doc.name = trimmed;
  }
  if (active !== undefined) doc.active = active;
  await doc.save();
  return formatQualityType(doc);
}
