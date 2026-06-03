import { Production } from '../models/Production.js';
import { User } from '../models/User.js';
import { getRecentEntries, countByStatus, countPendingApprovals } from './productionService.js';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  getCurrentMonthYear,
} from '../utils/dates.js';
import { PRODUCTION_STATUS } from '../config/constants.js';

async function sumProduction(match) {
  const result = await Production.aggregate([
    { $match: { ...match, status: PRODUCTION_STATUS.APPROVED } },
    {
      $group: {
        _id: null,
        totalKg: { $sum: { $add: ['$dryMachineKg', '$nonMachineKg'] } },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);
  return {
    totalKg: result[0]?.totalKg || 0,
    totalAmount: result[0]?.totalAmount || 0,
  };
}

export async function getAdminDashboard() {
  const now = new Date();
  const { month, year } = getCurrentMonthYear();

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);

  const [today, thisMonth, activeEmployees, pendingApprovalsCount] = await Promise.all([
    sumProduction({ date: { $gte: todayStart, $lte: todayEnd } }),
    sumProduction({ date: { $gte: monthStart, $lte: monthEnd } }),
    User.countDocuments({ role: 'employee', active: true }),
    countPendingApprovals(),
  ]);

  return {
    pendingApprovalsCount,
    todayProductionKg: today.totalKg,
    monthProductionKg: thisMonth.totalKg,
    todaySalaryCost: today.totalAmount,
    monthSalaryCost: thisMonth.totalAmount,
    activeEmployees,
  };
}

export async function getEmployeeDashboard(employeeId) {
  const now = new Date();
  const { month, year } = getCurrentMonthYear();

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);

  const baseToday = { employeeId, date: { $gte: todayStart, $lte: todayEnd } };
  const baseMonth = { employeeId, date: { $gte: monthStart, $lte: monthEnd } };

  const [today, thisMonth, recentProductionEntries, statusCounts] = await Promise.all([
    sumProduction(baseToday),
    sumProduction(baseMonth),
    getRecentEntries(employeeId, 5),
    countByStatus({ employeeId }),
  ]);

  return {
    todayProductionKg: today.totalKg,
    monthProductionKg: thisMonth.totalKg,
    estimatedEarnings: thisMonth.totalAmount,
    pendingEntries: statusCounts.pending,
    approvedEntries: statusCounts.approved,
    rejectedEntries: statusCounts.rejected,
    recentProductionEntries,
  };
}
