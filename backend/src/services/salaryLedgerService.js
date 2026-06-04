import mongoose from 'mongoose';
import { Production } from '../models/Production.js';
import { SalaryPayment } from '../models/SalaryPayment.js';
import { User } from '../models/User.js';
import { createError } from '../middleware/errorHandler.js';
import { PRODUCTION_STATUS } from '../config/constants.js';
import { startOfDay } from '../utils/dates.js';

function netAmountExpr() {
  return { $ifNull: ['$netAmount', '$totalAmount'] };
}

function paymentDateRangeQuery(from, to) {
  if (!from && !to) return {};
  const query = {};
  if (from) query.$gte = startOfDay(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    query.$lte = end;
  }
  return { date: query };
}

export async function sumTotalEarned(employeeId) {
  const match = {
    employeeId: new mongoose.Types.ObjectId(employeeId),
    status: PRODUCTION_STATUS.APPROVED,
  };
  const result = await Production.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: netAmountExpr() } } },
  ]);
  return result[0]?.total || 0;
}

export async function sumTotalPaid(employeeId) {
  const result = await SalaryPayment.aggregate([
    { $match: { employeeId: new mongoose.Types.ObjectId(employeeId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
}

export async function getEmployeeBalance(employeeId) {
  const [totalEarned, totalPaid] = await Promise.all([
    sumTotalEarned(employeeId),
    sumTotalPaid(employeeId),
  ]);
  return {
    totalEarned,
    totalPaid,
    balance: totalEarned - totalPaid,
  };
}

export async function sumOutstandingLiability() {
  const employees = await User.find({ role: 'employee', active: true }).select('_id').lean();
  let total = 0;
  for (const emp of employees) {
    const { balance } = await getEmployeeBalance(emp._id.toString());
    if (balance > 0) total += balance;
  }
  return total;
}

function formatPayment(doc) {
  const createdBy = doc.createdBy;
  return {
    id: doc._id.toString(),
    employeeId: doc.employeeId?.toString?.() || doc.employeeId.toString(),
    amount: doc.amount,
    date: doc.date,
    note: doc.note || '',
    createdBy: createdBy?._id?.toString() || doc.createdBy?.toString(),
    createdByName: createdBy?.name || undefined,
    createdAt: doc.createdAt,
  };
}

export async function listPayments(employeeId, { from, to } = {}) {
  const payments = await SalaryPayment.find({
    employeeId,
    ...paymentDateRangeQuery(from, to),
  })
    .populate('createdBy', 'name')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return payments.map(formatPayment);
}

export async function listEmployeeSummaries() {
  const employees = await User.find({ role: 'employee' })
    .select('name phone active')
    .sort({ name: 1 })
    .lean();

  const summaries = await Promise.all(
    employees.map(async (emp) => {
      const id = emp._id.toString();
      const { totalEarned, totalPaid, balance } = await getEmployeeBalance(id);
      return {
        employeeId: id,
        employeeName: emp.name,
        phone: emp.phone,
        active: emp.active,
        totalEarned,
        totalPaid,
        balance,
      };
    })
  );

  return summaries;
}

export async function getEmployeeLedger(employeeId, { from, to } = {}) {
  const employee = await User.findOne({ _id: employeeId, role: 'employee' }).select('name phone active');
  if (!employee) throw createError(404, 'Employee not found');

  const [totals, payments] = await Promise.all([
    getEmployeeBalance(employeeId),
    listPayments(employeeId, { from, to }),
  ]);

  return {
    employeeId: employee._id.toString(),
    employeeName: employee.name,
    phone: employee.phone,
    active: employee.active,
    totalEarned: totals.totalEarned,
    totalPaid: totals.totalPaid,
    balance: totals.balance,
    payments,
  };
}

export async function createSalaryPayment({ employeeId, amount, date, note, createdBy }) {
  const employee = await User.findOne({ _id: employeeId, role: 'employee' });
  if (!employee) throw createError(404, 'Employee not found');

  const paymentAmount = Number(amount);
  if (!paymentAmount || paymentAmount <= 0) {
    throw createError(400, 'Payment amount must be greater than 0');
  }

  const payment = await SalaryPayment.create({
    employeeId,
    amount: paymentAmount,
    date: startOfDay(date),
    note: (note || '').trim(),
    createdBy,
  });

  await payment.populate('createdBy', 'name');
  const totals = await getEmployeeBalance(employeeId);

  return {
    payment: formatPayment(payment.toObject()),
    ...totals,
  };
}
