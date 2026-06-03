import { Router } from 'express';
import { getSettings, putSettings } from '../controllers/settingsController.js';
import { requireAuth, requireAdmin, requireActiveUser } from '../middleware/auth.js';
import { settingsValidation } from '../validators/index.js';

const router = Router();

router.get('/', requireAuth, requireActiveUser, getSettings);
router.put('/', requireAuth, requireAdmin, settingsValidation, putSettings);

export default router;
