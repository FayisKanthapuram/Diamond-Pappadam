import { Router } from 'express';
import {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
} from '../controllers/employeeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { param } from 'express-validator';
import { createEmployeeValidation, updateEmployeeValidation } from '../validators/index.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', listEmployees);
router.post('/', createEmployeeValidation, createEmployee);
router.get('/:id', param('id').isMongoId(), getEmployee);
router.patch('/:id', updateEmployeeValidation, updateEmployee);

export default router;
