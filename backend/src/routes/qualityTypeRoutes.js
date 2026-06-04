import { Router } from 'express';
import { param } from 'express-validator';
import {
  getQualityTypes,
  postQualityType,
  patchQualityType,
} from '../controllers/qualityTypeController.js';
import { requireAuth, requireAdmin, requireActiveUser } from '../middleware/auth.js';
import { lookupTypeValidation } from '../validators/index.js';

const router = Router();

router.get('/', requireAuth, requireActiveUser, getQualityTypes);
router.post('/', requireAuth, requireAdmin, lookupTypeValidation, postQualityType);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  param('id').isMongoId(),
  lookupTypeValidation,
  patchQualityType
);

export default router;
