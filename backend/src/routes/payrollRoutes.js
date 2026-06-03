import { Router } from 'express';
import { generate, list, update } from '../controllers/payrollController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { payrollGenerateValidation, payrollUpdateValidation } from '../validators/index.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.post('/generate', payrollGenerateValidation, generate);
router.get('/', list);
router.patch('/:id', payrollUpdateValidation, update);

export default router;
