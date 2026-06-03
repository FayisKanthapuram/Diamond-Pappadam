import { User } from '../models/User.js';
import { DEFAULT_EMPLOYEE_PASSWORD } from '../config/constants.js';
import { createError } from '../middleware/errorHandler.js';

export function sanitizeEmployee(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    active: user.active,
  };
}

export async function listEmployees(activeFilter) {
  const query = { role: 'employee' };
  if (activeFilter !== undefined) query.active = activeFilter === 'true';
  const employees = await User.find(query).sort({ name: 1 });
  return employees.map(sanitizeEmployee);
}

export async function createEmployee({ name, phone }) {
  const existing = await User.findOne({ phone });
  if (existing) throw createError(409, 'Phone number already registered');

  const employee = await User.create({
    name,
    phone,
    password: DEFAULT_EMPLOYEE_PASSWORD,
    role: 'employee',
    active: true,
    mustChangePassword: true,
  });

  return sanitizeEmployee(employee);
}

export async function getEmployeeById(id) {
  const employee = await User.findOne({ _id: id, role: 'employee' });
  if (!employee) throw createError(404, 'Employee not found');
  return sanitizeEmployee(employee);
}

export async function updateEmployee(id, { name, phone, password, active }) {
  const employee = await User.findOne({ _id: id, role: 'employee' });
  if (!employee) throw createError(404, 'Employee not found');

  if (name !== undefined) employee.name = name;
  if (phone !== undefined) {
    const dup = await User.findOne({ phone, _id: { $ne: employee._id } });
    if (dup) throw createError(409, 'Phone number already registered');
    employee.phone = phone;
  }
  if (password) {
    employee.password = password;
    employee.mustChangePassword = false;
  }
  if (active !== undefined) employee.active = active;

  await employee.save();
  return sanitizeEmployee(employee);
}
