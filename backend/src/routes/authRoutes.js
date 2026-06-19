import { Router } from 'express';
import { adminLogin, employeeLogin, salesLogin, changePassword, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginValidation, changePasswordValidation } from '../validators/index.js';

const router = Router();

router.post('/admin/login', loginValidation, adminLogin);
router.post('/employee/login', loginValidation, employeeLogin);
router.post('/sales/login', loginValidation, salesLogin);
router.post('/change-password', requireAuth, changePasswordValidation, changePassword);
router.get('/me', requireAuth, getMe);

export default router;
