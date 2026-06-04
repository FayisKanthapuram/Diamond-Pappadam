import { validationResult } from 'express-validator';
import {
  listEmployeeSummaries,
  getEmployeeLedger,
  createSalaryPayment,
} from '../services/salaryLedgerService.js';

export async function listSummaries(req, res, next) {
  try {
    const summaries = await listEmployeeSummaries();
    let result = summaries;
    if (req.query.employeeId) {
      result = summaries.filter((s) => s.employeeId === req.query.employeeId);
    }
    res.json({ summaries: result });
  } catch (err) {
    next(err);
  }
}

export async function getLedger(req, res, next) {
  try {
    const { from, to } = req.query;
    const ledger = await getEmployeeLedger(req.params.employeeId, { from, to });
    res.json({ ledger });
  } catch (err) {
    next(err);
  }
}

export async function getMyLedger(req, res, next) {
  try {
    const { from, to } = req.query;
    const ledger = await getEmployeeLedger(req.user.id, { from, to });
    res.json({ ledger });
  } catch (err) {
    next(err);
  }
}

export async function addPayment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { amount, date, note } = req.body;
    const result = await createSalaryPayment({
      employeeId: req.params.employeeId,
      amount,
      date,
      note,
      createdBy: req.user.id,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
