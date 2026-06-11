import { Router } from 'express';
import { param } from 'express-validator';
import {
  createProduction,
  updateProduction,
  deleteProduction,
  revertProduction,
  getMyProductions,
  listProductions,
  listPendingProductions,
  getMyEarnings,
  approveProduction,
  rejectProduction,
} from '../controllers/productionController.js';
import { requireAuth, requireAdmin, requireEmployee, requireActiveUser } from '../middleware/auth.js';
import {
  productionValidation,
  productionUpdateValidation,
  productionApproveValidation,
  productionRejectValidation,
} from '../validators/index.js';

const router = Router();

router.post('/', requireAuth, requireEmployee, requireActiveUser, productionValidation, createProduction);
router.get('/me', requireAuth, requireEmployee, requireActiveUser, getMyProductions);
router.get('/me/earnings', requireAuth, requireEmployee, requireActiveUser, getMyEarnings);
router.get('/pending', requireAuth, requireAdmin, listPendingProductions);
router.patch('/:id/approve', requireAuth, requireAdmin, productionApproveValidation, approveProduction);
router.patch(
  '/:id/reject',
  requireAuth,
  requireAdmin,
  productionRejectValidation,
  rejectProduction
);
router.patch('/:id/revert', requireAuth, requireAdmin, param('id').isMongoId(), revertProduction);
router.patch('/:id', requireAuth, requireActiveUser, productionUpdateValidation, updateProduction);
router.delete('/:id', requireAuth, requireAdmin, param('id').isMongoId(), deleteProduction);
router.get('/', requireAuth, requireAdmin, listProductions);

export default router;
