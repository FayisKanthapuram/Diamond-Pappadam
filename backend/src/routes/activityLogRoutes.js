import { Router } from 'express';
import { listLogs } from '../controllers/activityLogController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', listLogs);

export default router;
