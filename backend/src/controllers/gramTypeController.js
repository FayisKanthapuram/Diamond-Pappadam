import { validationResult } from 'express-validator';
import { listGramTypes, createGramType, updateGramType } from '../services/gramTypeService.js';
import { logAction } from '../services/activityLogService.js';

export async function getGramTypes(req, res, next) {
  try {
    const activeOnly = req.user.role === 'employee' || req.query.active === 'true';
    const gramTypes = await listGramTypes({ activeOnly });
    res.json({ gramTypes });
  } catch (err) {
    next(err);
  }
}

export async function postGramType(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const gramType = await createGramType({ name: req.body.name });

    // Log gram type added
    await logAction(req.user, {
      action: 'Gram type added',
      description: `Added new gram type: ${gramType.name}`,
      targetType: 'GramType',
      targetId: gramType.id,
    });

    res.status(201).json({ gramType });
  } catch (err) {
    next(err);
  }
}

export async function patchGramType(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const gramType = await updateGramType(req.params.id, {
      name: req.body.name,
      active: req.body.active,
    });
    res.json({ gramType });
  } catch (err) {
    next(err);
  }
}
