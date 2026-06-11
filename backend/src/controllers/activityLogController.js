import * as activityLogService from '../services/activityLogService.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';

export async function listLogs(req, res, next) {
  try {
    const { from, to, action, performedBy } = req.query;
    
    // Fetch logs based on filters
    const logs = await activityLogService.listLogEntries({ from, to, action, performedBy });
    
    // Get unique actions and users list for filters
    const [actionTypes, users] = await Promise.all([
      ActivityLog.distinct('action'),
      User.find().select('name role active').sort({ name: 1 }).lean(),
    ]);

    res.json({
      logs,
      actionTypes,
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        role: u.role,
        active: u.active
      }))
    });
  } catch (err) {
    next(err);
  }
}
