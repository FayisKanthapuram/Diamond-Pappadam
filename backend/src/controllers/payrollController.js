import { validationResult } from 'express-validator';
import {
  generatePayroll,
  listPayrolls,
  markPayrollPaid,
} from '../services/payrollService.js';

function formatPayroll(doc) {
  const emp = doc.employeeId;
  return {
    id: doc._id.toString(),
    employeeId: emp?._id?.toString() || doc.employeeId?.toString(),
    employeeName: emp?.name,
    employeePhone: emp?.phone,
    month: doc.month,
    year: doc.year,
    totalDryMachineKg: doc.totalDryMachineKg,
    totalNonMachineKg: doc.totalNonMachineKg,
    totalKg: doc.totalKg,
    totalEarnings: doc.totalEarnings,
    paymentStatus: doc.paymentStatus,
    paymentDate: doc.paymentDate,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

export async function generate(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { month, year } = req.body;
    const result = await generatePayroll(month, year);
    res.json({
      message: `Payroll generated for ${month}/${year}`,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      payrolls: result.payrolls.map((p) => formatPayroll(p.toObject ? { ...p.toObject(), employeeId: p.employeeId } : p)),
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const payrolls = await listPayrolls(req.query);
    res.json({ payrolls: payrolls.map(formatPayroll) });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { paymentDate, notes } = req.body;
    const payroll = await markPayrollPaid(req.params.id, { paymentDate, notes });
    res.json({ payroll: formatPayroll(payroll.toObject()) });
  } catch (err) {
    next(err);
  }
}
