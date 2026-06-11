import { ActivityLog } from '../models/ActivityLog.js';
import { startOfDay } from '../utils/dates.js';

export async function logAction(reqUser, { action, description, targetType, targetId }) {
  if (!reqUser || !reqUser.id || !reqUser.role) {
    // If not authenticated (should not happen for guarded routes), default gracefully
    return null;
  }
  
  const log = await ActivityLog.create({
    action,
    description,
    performedBy: reqUser.id,
    performedByRole: reqUser.role,
    targetType,
    targetId: targetId ? targetId.toString() : undefined,
  });

  return log;
}

export async function listLogEntries({ from, to, action, performedBy } = {}) {
  const query = {};
  
  if (action) {
    query.action = action;
  }
  if (performedBy) {
    query.performedBy = performedBy;
  }
  
  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = startOfDay(from);
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const logs = await ActivityLog.find(query)
    .populate('performedBy', 'name phone role')
    .sort({ createdAt: -1 })
    .lean();

  return logs.map((log) => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description,
    performedBy: log.performedBy ? {
      id: log.performedBy._id.toString(),
      name: log.performedBy.name,
      phone: log.performedBy.phone,
      role: log.performedBy.role,
    } : null,
    performedByRole: log.performedByRole,
    targetType: log.targetType,
    targetId: log.targetId,
    createdAt: log.createdAt,
  }));
}
