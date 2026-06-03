import { body, param } from 'express-validator';

export const loginValidation = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

export const createEmployeeValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
];

export const updateEmployeeValidation = [
  param('id').isMongoId().withMessage('Invalid employee id'),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
  body('active').optional().isBoolean(),
];

export const settingsValidation = [
  body('dryMachineRate').isFloat({ min: 0 }).withMessage('Dry machine rate must be a positive number'),
  body('nonMachineRate').isFloat({ min: 0 }).withMessage('Non-machine rate must be a positive number'),
];

export const productionValidation = [
  body('date').notEmpty().withMessage('Date is required'),
  body('dryMachineKg').optional().isFloat({ min: 0 }),
  body('nonMachineKg').optional().isFloat({ min: 0 }),
  body('notes').optional().isString().trim(),
];

export const productionUpdateValidation = [
  param('id').isMongoId(),
  body('date').optional().notEmpty(),
  body('dryMachineKg').optional().isFloat({ min: 0 }),
  body('nonMachineKg').optional().isFloat({ min: 0 }),
  body('notes').optional().isString().trim(),
];

export const productionApproveValidation = [
  param('id').isMongoId(),
  body('bonusAmount').optional().isFloat({ min: 0 }).withMessage('Bonus must be zero or positive'),
  body('deductionAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deduction must be zero or positive'),
  body('adjustmentReason').optional().isString().trim(),
];

export const productionRejectValidation = [
  param('id').isMongoId(),
  body('rejectionReason').trim().notEmpty().withMessage('Rejection reason is required'),
];

export const payrollGenerateValidation = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2020 }).withMessage('Valid year is required'),
];

export const payrollUpdateValidation = [
  param('id').isMongoId(),
  body('paymentDate').optional().isISO8601(),
  body('notes').optional().isString(),
];
