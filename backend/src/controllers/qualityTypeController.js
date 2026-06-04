import { validationResult } from 'express-validator';
import {
  listQualityTypes,
  createQualityType,
  updateQualityType,
} from '../services/qualityTypeService.js';

export async function getQualityTypes(req, res, next) {
  try {
    const activeOnly = req.user.role === 'employee' || req.query.active === 'true';
    const qualityTypes = await listQualityTypes({ activeOnly });
    res.json({ qualityTypes });
  } catch (err) {
    next(err);
  }
}

export async function postQualityType(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const qualityType = await createQualityType({ name: req.body.name });
    res.status(201).json({ qualityType });
  } catch (err) {
    next(err);
  }
}

export async function patchQualityType(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const qualityType = await updateQualityType(req.params.id, {
      name: req.body.name,
      active: req.body.active,
    });
    res.json({ qualityType });
  } catch (err) {
    next(err);
  }
}
