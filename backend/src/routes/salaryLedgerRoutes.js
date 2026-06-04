import { Router } from 'express';
import { param } from 'express-validator';
import {
  listSummaries,
  getLedger,
  getMyLedger,
  addPayment,
} from '../controllers/salaryLedgerController.js';
import { requireAuth, requireAdmin, requireEmployee, requireActiveUser } from '../middleware/auth.js';
import { salaryPaymentValidation } from '../validators/index.js';

const router = Router();

router.get('/me', requireAuth, requireEmployee, requireActiveUser, getMyLedger);
router.get('/', requireAuth, requireAdmin, listSummaries);
router.get(
  '/employees/:employeeId',
  requireAuth,
  requireAdmin,
  param('employeeId').isMongoId(),
  getLedger
);
router.post(
  '/employees/:employeeId/payments',
  requireAuth,
  requireAdmin,
  param('employeeId').isMongoId(),
  salaryPaymentValidation,
  addPayment
);

export default router;
