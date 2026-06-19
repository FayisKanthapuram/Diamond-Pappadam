import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { createError } from './errorHandler.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(createError(401, 'Authentication required'));
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = payload.userId ?? payload.sub;
    if (!userId || !payload.role) {
      return next(createError(401, 'Invalid or expired token'));
    }
    req.user = { id: userId, role: payload.role };
    next();
  } catch {
    next(createError(401, 'Invalid or expired token'));
  }
}

export const authenticate = requireAuth;

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next(createError(403, 'Admin access required'));
  }
  next();
}

export function requireEmployee(req, _res, next) {
  if (req.user?.role !== 'employee') {
    return next(createError(403, 'Employee access required'));
  }
  next();
}

export function requireSales(req, _res, next) {
  if (req.user?.role !== 'sales') {
    return next(createError(403, 'Sales access required'));
  }
  next();
}

export async function requireActiveUser(req, _res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.active) {
      return next(createError(403, 'Account is disabled'));
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
