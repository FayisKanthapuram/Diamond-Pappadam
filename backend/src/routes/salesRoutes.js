import { Router } from 'express';
import {
  createCustomer,
  updateCustomer,
  listCustomers,
  getCustomerDetail,
  getCustomerLedger,
  getCustomerStatement,
  createSale,
  listSales,
  updateSale,
  deleteSale,
  markInvoiceSent,
  createPayment,
  updatePayment,
  deletePayment,
  getSalesDashboard,
} from '../controllers/salesController.js';
import { requireAuth, requireSales } from '../middleware/auth.js';

const router = Router();

// Secure all endpoints with authentication and sales manager role checks
router.use(requireAuth, requireSales);

// Dashboard stats
router.get('/dashboard', getSalesDashboard);

// Customer endpoints
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomerDetail);
router.get('/customers/:id/ledger', getCustomerLedger);
router.get('/customers/:id/statement', getCustomerStatement);

// Sales endpoints
router.post('/sales', createSale);
router.get('/sales', listSales);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);
router.patch('/sales/:id/sent', markInvoiceSent);

// Payment endpoints
router.post('/payments', createPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

export default router;
