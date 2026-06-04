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

export const lookupTypeValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name is required'),
  body('active').optional().isBoolean(),
];

export const productionItemValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one production row is required'),
  body('items.*.type').isIn(['normal', 'special']).withMessage('Invalid row type'),
  body('items.*.method').isIn(['dry', 'non']).withMessage('Invalid production method'),
  body('items.*.kg').isFloat({ min: 0.01 }).withMessage('KG must be greater than 0'),
  body('items.*.gramTypeId').optional().isMongoId(),
  body('items.*.qualityTypeId').optional().isMongoId(),
  body('items.*.specialType').optional().isString().trim(),
];

export const productionValidation = [
  body('date').notEmpty().withMessage('Date is required'),
  body('notes').optional().isString().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one production row is required'),
  body('items.*.type').isIn(['normal', 'special']).withMessage('Invalid row type'),
  body('items.*.method').isIn(['dry', 'non']).withMessage('Invalid production method'),
  body('items.*.kg').isFloat({ min: 0.01 }).withMessage('KG must be greater than 0'),
  body('items.*.gramTypeId').optional().isMongoId(),
  body('items.*.qualityTypeId').optional().isMongoId(),
  body('items.*.specialType').optional().isString().trim(),
];

export const productionUpdateValidation = [
  param('id').isMongoId(),
  body('date').optional().notEmpty(),
  body('notes').optional().isString().trim(),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.type').optional().isIn(['normal', 'special']),
  body('items.*.method').optional().isIn(['dry', 'non']),
  body('items.*.kg').optional().isFloat({ min: 0.01 }),
  body('items.*.gramTypeId').optional().isMongoId(),
  body('items.*.qualityTypeId').optional().isMongoId(),
  body('items.*.specialType').optional().isString().trim(),
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

export const salaryPaymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').notEmpty().withMessage('Payment date is required'),
  body('note').optional().isString().trim(),
];
