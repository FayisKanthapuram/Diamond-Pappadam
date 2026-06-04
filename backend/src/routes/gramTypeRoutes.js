import { Router } from 'express';
import { param } from 'express-validator';
import { getGramTypes, postGramType, patchGramType } from '../controllers/gramTypeController.js';
import { requireAuth, requireAdmin, requireActiveUser } from '../middleware/auth.js';
import { lookupTypeValidation } from '../validators/index.js';

const router = Router();

router.get('/', requireAuth, requireActiveUser, getGramTypes);
router.post('/', requireAuth, requireAdmin, lookupTypeValidation, postGramType);
router.patch('/:id', requireAuth, requireAdmin, param('id').isMongoId(), lookupTypeValidation, patchGramType);

export default router;
