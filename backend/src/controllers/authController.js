import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword || false,
  };
}

async function loginWithRole(req, res, next, expectedRole) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { phone, password } = req.body;
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    if (user.role !== expectedRole) {
      return res.status(403).json({ message: 'Access denied for this portal' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: sanitizeUser(user),
      mustChangePassword: !!user.mustChangePassword,
    });
  } catch (err) {
    next(err);
  }
}

export function adminLogin(req, res, next) {
  return loginWithRole(req, res, next, 'admin');
}

export function employeeLogin(req, res, next) {
  return loginWithRole(req, res, next, 'employee');
}

export async function changePassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return next(createError(404, 'User not found'));

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password updated successfully', mustChangePassword: false });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, 'User not found'));
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}
