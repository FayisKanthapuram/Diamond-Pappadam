import { Production } from '../models/Production.js';
import { Payroll } from '../models/Payroll.js';
import { User } from '../models/User.js';
import { startOfMonth, endOfMonth } from '../utils/dates.js';
import { createError } from '../middleware/errorHandler.js';
import { PRODUCTION_STATUS } from '../config/constants.js';

export async function generatePayroll(month, year) {
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);

  const aggregated = await Production.aggregate([
    {
      $match: {
        date: { $gte: monthStart, $lte: monthEnd },
        status: PRODUCTION_STATUS.APPROVED,
      },
    },
    {
      $group: {
        _id: '$employeeId',
        totalDryMachineKg: { $sum: '$dryMachineKg' },
        totalNonMachineKg: { $sum: '$nonMachineKg' },
        totalEarnings: { $sum: '$totalAmount' },
      },
    },
  ]);

  const activeEmployees = await User.find({ role: 'employee', active: true }).select('_id');
  const employeeIds = new Set(activeEmployees.map((e) => e._id.toString()));

  const results = { created: 0, updated: 0, skipped: 0, payrolls: [] };

  for (const row of aggregated) {
    if (!employeeIds.has(row._id.toString())) continue;

    const totalKg = row.totalDryMachineKg + row.totalNonMachineKg;
    const existing = await Payroll.findOne({
      employeeId: row._id,
      month,
      year,
    });

    if (existing?.paymentStatus === 'paid') {
      results.skipped += 1;
      results.payrolls.push(existing);
      continue;
    }

    const data = {
      employeeId: row._id,
      month,
      year,
      totalDryMachineKg: row.totalDryMachineKg,
      totalNonMachineKg: row.totalNonMachineKg,
      totalKg,
      totalEarnings: row.totalEarnings,
    };

    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      results.updated += 1;
      results.payrolls.push(existing);
    } else {
      const payroll = await Payroll.create({ ...data, paymentStatus: 'pending' });
      results.created += 1;
      results.payrolls.push(payroll);
    }
  }

  return results;
}

export async function listPayrolls(filters) {
  const query = {};
  if (filters.month) query.month = parseInt(filters.month, 10);
  if (filters.year) query.year = parseInt(filters.year, 10);
  if (filters.employeeId) query.employeeId = filters.employeeId;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;

  return Payroll.find(query)
    .populate('employeeId', 'name phone')
    .sort({ year: -1, month: -1 })
    .lean();
}

export async function markPayrollPaid(id, { paymentDate, notes }) {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw createError(404, 'Payroll not found');

  payroll.paymentStatus = 'paid';
  payroll.paymentDate = paymentDate || new Date();
  if (notes !== undefined) payroll.notes = notes;
  await payroll.save();
  return payroll.populate('employeeId', 'name phone');
}
