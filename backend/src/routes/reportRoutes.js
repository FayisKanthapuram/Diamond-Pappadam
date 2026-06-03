import { Router } from 'express';
import { getProductionReport } from '../controllers/productionController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/production', requireAuth, requireAdmin, getProductionReport);

export default router;
