import { Router } from 'express';
import { adminDashboard, employeeDashboard } from '../controllers/dashboardController.js';
import {
  requireAuth,
  requireAdmin,
  requireEmployee,
  requireActiveUser,
} from '../middleware/auth.js';

const router = Router();

router.get('/admin', requireAuth, requireAdmin, adminDashboard);
router.get('/employee', requireAuth, requireEmployee, requireActiveUser, employeeDashboard);

export default router;
