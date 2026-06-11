import { validationResult } from 'express-validator';
import * as employeeService from '../services/employeeService.js';
import { logAction } from '../services/activityLogService.js';

export async function listEmployees(req, res, next) {
  try {
    const employees = await employeeService.listEmployees(req.query.active);
    res.json({ employees });
  } catch (err) {
    next(err);
  }
}

export async function createEmployee(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const employee = await employeeService.createEmployee(req.body);
    
    // Log employee creation
    await logAction(req.user, {
      action: 'Employee created',
      description: `Created employee ${employee.name} (${employee.phone})`,
      targetType: 'User',
      targetId: employee.id,
    });

    res.status(201).json({
      employee,
      message: 'Employee created with default password 123456. They must change it on first login.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployee(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({ employee });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    
    // Log employee update / disabled
    if (req.body.active === false) {
      await logAction(req.user, {
        action: 'Employee disabled',
        description: `Disabled employee ${employee.name} (${employee.phone})`,
        targetType: 'User',
        targetId: employee.id,
      });
    } else {
      await logAction(req.user, {
        action: 'Employee updated',
        description: `Updated employee ${employee.name} (${employee.phone})`,
        targetType: 'User',
        targetId: employee.id,
      });
    }

    res.json({ employee });
  } catch (err) {
    next(err);
  }
}
