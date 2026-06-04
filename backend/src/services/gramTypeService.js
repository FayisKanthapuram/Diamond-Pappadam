import { GramType } from '../models/GramType.js';
import { createError } from '../middleware/errorHandler.js';

function formatGramType(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    active: doc.active,
    sortOrder: doc.sortOrder ?? 0,
  };
}

export async function listGramTypes({ activeOnly = false } = {}) {
  const query = activeOnly ? { active: true } : {};
  const types = await GramType.find(query).sort({ sortOrder: 1, name: 1 });
  return types.map(formatGramType);
}

export async function createGramType({ name }) {
  const trimmed = name.trim();
  if (!trimmed) throw createError(400, 'Name is required');
  const existing = await GramType.findOne({ name: trimmed });
  if (existing) throw createError(400, 'Gram type already exists');
  const doc = await GramType.create({ name: trimmed, active: true });
  return formatGramType(doc);
}

export async function updateGramType(id, { name, active }) {
  const doc = await GramType.findById(id);
  if (!doc) throw createError(404, 'Gram type not found');
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) throw createError(400, 'Name is required');
    const existing = await GramType.findOne({ name: trimmed, _id: { $ne: id } });
    if (existing) throw createError(400, 'Gram type already exists');
    doc.name = trimmed;
  }
  if (active !== undefined) doc.active = active;
  await doc.save();
  return formatGramType(doc);
}
