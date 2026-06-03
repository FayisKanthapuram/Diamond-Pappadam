import { getAdminDashboard, getEmployeeDashboard } from '../services/dashboardService.js';

export async function adminDashboard(req, res, next) {
  try {
    const data = await getAdminDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function employeeDashboard(req, res, next) {
  try {
    const data = await getEmployeeDashboard(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
