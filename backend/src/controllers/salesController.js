import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';
import { createError } from '../middleware/errorHandler.js';
import { startOfDay, endOfDay } from '../utils/dates.js';
import { logAction } from '../services/activityLogService.js';

// Helper to calculate statistics for a customer
async function computeCustomerStats(customerId) {
  const customerIdObj = new mongoose.Types.ObjectId(customerId);

  // Sum sales total amount and received amount during sales
  const salesAgg = await Sale.aggregate([
    { $match: { customerId: customerIdObj } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $ifNull: ['$finalSaleAmount', '$totalAmount'] } },
        totalReceivedSales: { $sum: '$receivedAmount' },
      },
    },
  ]);

  // Sum standalone payments received
  const paymentsAgg = await Payment.aggregate([
    { $match: { customerId: customerIdObj } },
    {
      $group: {
        _id: null,
        totalStandalonePaid: { $sum: '$amount' },
      },
    },
  ]);

  const totalSales = salesAgg[0]?.totalSales || 0;
  const totalReceivedSales = salesAgg[0]?.totalReceivedSales || 0;
  const totalPaidStandalone = paymentsAgg[0]?.totalStandalonePaid || 0;

  const customer = await Customer.findById(customerIdObj).select('openingBalance').lean();
  const openingBalance = customer?.openingBalance || 0;
  const totalReceived = totalReceivedSales + totalPaidStandalone;
  const balance = openingBalance + totalSales - totalReceived;

  return {
    openingBalance,
    totalSales,
    totalReceived,
    balance,
  };
}

// Helper to calculate outstanding balance for a customer before a certain point in time
async function getOutstandingBalanceBefore(customerId, saleDate, excludeSaleId = null) {
  const customerIdObj = new mongoose.Types.ObjectId(customerId);
  const targetDate = new Date(saleDate);

  const salesQuery = { customerId: customerIdObj };
  if (excludeSaleId) {
    salesQuery._id = { $ne: new mongoose.Types.ObjectId(excludeSaleId) };
  }

  const allSales = await Sale.find(salesQuery).lean();
  const allPayments = await Payment.find({ customerId: customerIdObj }).lean();

  const txs = [];
  for (const s of allSales) {
    txs.push({
      type: 'sale',
      date: new Date(s.date),
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(s.date),
      netImpact: (s.finalSaleAmount !== undefined ? s.finalSaleAmount : s.totalAmount) - s.receivedAmount,
    });
  }

  for (const p of allPayments) {
    txs.push({
      type: 'payment',
      date: new Date(p.date),
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(p.date),
      netImpact: -p.amount,
    });
  }

  txs.sort((a, b) => {
    const dDiff = a.date - b.date;
    if (dDiff !== 0) return dDiff;
    return a.createdAt - b.createdAt;
  });

  let targetCreatedAt = null;
  if (excludeSaleId) {
    const saleToUpdate = await Sale.findById(excludeSaleId).select('createdAt').lean();
    if (saleToUpdate && saleToUpdate.createdAt) {
      targetCreatedAt = new Date(saleToUpdate.createdAt);
    }
  }

  const customer = await Customer.findById(customerIdObj).select('openingBalance').lean();
  let runningBalance = customer?.openingBalance || 0;
  for (const tx of txs) {
    if (tx.date < targetDate) {
      runningBalance += tx.netImpact;
    } else if (tx.date.getTime() === targetDate.getTime()) {
      if (targetCreatedAt && tx.createdAt < targetCreatedAt) {
        runningBalance += tx.netImpact;
      } else if (!targetCreatedAt) {
        // Creating new sale: all existing day-of transactions count as prior
        runningBalance += tx.netImpact;
      }
    }
  }

  return runningBalance;
}

// 1. Create Customer
export async function createCustomer(req, res, next) {
  try {
    const { name, phone, place, notes, openingBalance = 0 } = req.body;
    if (!name || !phone || !place) {
      return next(createError(400, 'Name, phone, and place are required'));
    }

    const opBal = Number(openingBalance) || 0;
    if (opBal < 0) {
      return next(createError(400, 'Opening balance cannot be negative'));
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      place: place.trim(),
      notes: (notes || '').trim(),
      openingBalance: opBal,
      active: true,
    });

    res.status(201).json({ customer });
  } catch (err) {
    next(err);
  }
}

// 1.1 Update Customer Details (including Opening Balance)
export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, place, notes, openingBalance = 0, active } = req.body;

    if (!name || !phone || !place) {
      return next(createError(400, 'Name, phone, and place are required'));
    }

    const opBal = Number(openingBalance) || 0;
    if (opBal < 0) {
      return next(createError(400, 'Opening balance cannot be negative'));
    }

    const customer = await Customer.findById(id);
    if (!customer) return next(createError(404, 'Customer not found'));

    customer.name = name.trim();
    customer.phone = phone.trim();
    customer.place = place.trim();
    customer.notes = (notes || '').trim();
    customer.openingBalance = opBal;
    if (active !== undefined) {
      customer.active = !!active;
    }

    await customer.save();

    await logAction(req.user, {
      action: 'Customer updated',
      description: `Updated profile details for customer ${customer.name}`,
      targetType: 'Customer',
      targetId: customer._id,
    });

    res.json({ customer });
  } catch (err) {
    next(err);
  }
}

// 2. List Customers (Name, Phone, Place, Outstanding Balance, Last Sale Date)
export async function listCustomers(req, res, next) {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const cleanSearch = search.trim();
      filter.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { phone: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).sort({ name: 1 }).lean();

    const result = await Promise.all(
      customers.map(async (cust) => {
        const stats = await computeCustomerStats(cust._id);
        const lastSale = await Sale.findOne({ customerId: cust._id })
          .sort({ date: -1 })
          .select('date')
          .lean();

        return {
          id: cust._id.toString(),
          name: cust.name,
          phone: cust.phone,
          place: cust.place,
          notes: cust.notes || '',
          active: cust.active,
          outstandingBalance: stats.balance,
          totalSales: stats.totalSales,
          totalReceived: stats.totalReceived,
          lastSaleDate: lastSale?.date || null,
        };
      })
    );

    res.json({ customers: result });
  } catch (err) {
    next(err);
  }
}

// 3. Get Customer Summary Stats & History
export async function getCustomerDetail(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();
    if (!customer) return next(createError(404, 'Customer not found'));

    const stats = await computeCustomerStats(id);

    // Fetch sales (newest first)
    const sales = await Sale.find({ customerId: id }).sort({ date: -1, createdAt: -1 }).lean();

    // Fetch payments (newest first)
    const payments = await Payment.find({ customerId: id }).sort({ date: -1, createdAt: -1 }).lean();

    res.json({
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        place: customer.place,
        notes: customer.notes || '',
        openingBalance: customer.openingBalance || 0,
        active: customer.active,
      },
      stats,
      sales: sales.map((s) => ({
        id: s._id.toString(),
        date: s.date,
        items: s.items || [],
        totalAmount: s.totalAmount,
        subtotalAmount: s.subtotalAmount || s.totalAmount || 0,
        discountAmount: s.discountAmount || 0,
        finalSaleAmount: s.finalSaleAmount !== undefined ? s.finalSaleAmount : s.totalAmount,
        discountReason: s.discountReason || '',
        receivedAmount: s.receivedAmount,
        balanceAmount: s.balanceAmount,
        notes: s.notes || '',
        invoiceSentAt: s.invoiceSentAt,
        previousBalance: s.previousBalance,
        saleAmount: s.saleAmount,
        balanceAfterSale: s.balanceAfterSale,
      })),
      payments: payments.map((p) => ({
        id: p._id.toString(),
        date: p.date,
        amount: p.amount,
        notes: p.notes || '',
      })),
    });
  } catch (err) {
    next(err);
  }
}

// 4. Get Customer Chronological Ledger
export async function getCustomerLedger(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();
    if (!customer) return next(createError(404, 'Customer not found'));

    // Fetch sales and standalone payments
    const sales = await Sale.find({ customerId: id }).sort({ date: 1, createdAt: 1 }).lean();
    const payments = await Payment.find({ customerId: id }).sort({ date: 1, createdAt: 1 }).lean();

    // Map into ledger items
    const transactions = [];

    // Push Opening Balance entry
    transactions.push({
      type: 'opening-balance',
      id: `ob-${customer._id}`,
      date: customer.createdAt || new Date(0),
      createdAt: customer.createdAt || new Date(0),
      amount: customer.openingBalance || 0,
      netBalanceImpact: customer.openingBalance || 0,
      description: 'Opening Balance',
    });

    for (const sale of sales) {
      transactions.push({
        type: 'sale',
        id: sale._id.toString(),
        date: sale.date,
        createdAt: sale.createdAt,
        totalAmount: sale.totalAmount,
        subtotalAmount: sale.subtotalAmount || sale.totalAmount || 0,
        discountAmount: sale.discountAmount || 0,
        finalSaleAmount: sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount,
        receivedAmount: sale.receivedAmount,
        netBalanceImpact: (sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount) - sale.receivedAmount,
        description: sale.discountAmount > 0
          ? `Sale (Subtotal: Rs. ${(sale.subtotalAmount || sale.totalAmount).toFixed(2)}, Discount: Rs. ${sale.discountAmount.toFixed(2)}, Paid: Rs. ${sale.receivedAmount.toFixed(2)})`
          : `Sale (Subtotal: Rs. ${sale.totalAmount.toFixed(2)}, Paid: Rs. ${sale.receivedAmount.toFixed(2)})`,
      });
    }

    for (const pm of payments) {
      transactions.push({
        type: 'payment',
        id: pm._id.toString(),
        date: pm.date,
        createdAt: pm.createdAt,
        amount: pm.amount,
        netBalanceImpact: -pm.amount,
        description: pm.notes ? `Payment Received - ${pm.notes}` : 'Payment Received',
      });
    }

    // Sort chronologically by date, breaking ties with createdAt
    transactions.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      if (a.type === 'opening-balance') return -1;
      if (b.type === 'opening-balance') return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Compute running balance
    let runningBalance = 0;
    const ledger = transactions.map((tx) => {
      runningBalance += tx.netBalanceImpact;
      return {
        ...tx,
        balance: runningBalance,
      };
    });

    // Reverse for descending history presentation (newest first)
    ledger.reverse();

    res.json({
      customer: {
        id: customer._id.toString(),
        name: customer.name,
      },
      ledger,
    });
  } catch (err) {
    next(err);
  }
}

// 5. Record a Sale
export async function createSale(req, res, next) {
  try {
    const { customerId, date, items, receivedAmount = 0, notes } = req.body;

    if (!customerId || !date || !Array.isArray(items) || items.length === 0) {
      return next(createError(400, 'Customer ID, date, and items are required'));
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return next(createError(404, 'Customer not found'));
    if (!customer.active) return next(createError(400, 'Customer account is disabled'));

    const normalizedItems = [];
    let subtotal = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      if (!item.description?.trim()) {
        return next(createError(400, `Item ${i + 1}: Description is required`));
      }
      if (!item.unit || !['KG', 'Packet'].includes(item.unit)) {
        return next(createError(400, `Item ${i + 1}: Unit must be KG or Packet`));
      }
      if (isNaN(quantity) || quantity <= 0) {
        return next(createError(400, `Item ${i + 1}: Quantity must be greater than 0`));
      }
      if (isNaN(rate) || rate <= 0) {
        return next(createError(400, `Item ${i + 1}: Rate must be greater than 0`));
      }

      const itemAmount = quantity * rate;
      subtotal += itemAmount;

      normalizedItems.push({
        description: item.description.trim(),
        unit: item.unit,
        quantity,
        rate,
        amount: itemAmount,
      });
    }

    const disc = Math.max(0, Number(req.body.discountAmount) || 0);
    if (disc < 0) {
      return next(createError(400, 'Discount cannot be negative'));
    }
    if (disc > subtotal) {
      return next(createError(400, 'Discount cannot exceed subtotal amount'));
    }

    const finalSaleAmount = subtotal - disc;
    const received = Math.max(0, Number(receivedAmount) || 0);

    const previousBalance = await getOutstandingBalanceBefore(customerId, startOfDay(date));
    const totalDue = previousBalance + finalSaleAmount;
    if (received > totalDue) {
      return next(createError(400, `Received amount cannot exceed Total Due (Rs. ${totalDue.toFixed(2)})`));
    }

    const balance = finalSaleAmount - received;
    const saleAmount = finalSaleAmount;
    const balanceAfterSale = previousBalance + saleAmount - received;

    const sale = await Sale.create({
      customerId,
      date: startOfDay(date),
      items: normalizedItems,
      totalAmount: subtotal,
      subtotalAmount: subtotal,
      discountAmount: disc,
      finalSaleAmount,
      discountReason: (req.body.discountReason || '').trim(),
      receivedAmount: received,
      balanceAmount: balance,
      createdBy: req.user.id,
      notes: (notes || '').trim(),
      previousBalance,
      saleAmount,
      balanceAfterSale,
    });

    await logAction(req.user, {
      action: 'Sale created',
      description: `Created sale of Rs. ${subtotal.toFixed(2)} (Paid: Rs. ${received.toFixed(2)}) for customer ${customer.name}`,
      targetType: 'Sale',
      targetId: sale._id,
    });

    res.status(201).json({ sale });
  } catch (err) {
    next(err);
  }
}

// 6. List Sales
export async function listSales(req, res, next) {
  try {
    const sales = await Sale.find()
      .populate('customerId', 'name phone place')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formattedSales = sales.map((sale) => ({
      id: sale._id.toString(),
      customerId: sale.customerId?._id?.toString(),
      customerName: sale.customerId?.name || 'Deleted Customer',
      customerPhone: sale.customerId?.phone || '',
      customerPlace: sale.customerId?.place || '',
      date: sale.date,
      totalAmount: sale.totalAmount,
      subtotalAmount: sale.subtotalAmount || sale.totalAmount || 0,
      discountAmount: sale.discountAmount || 0,
      finalSaleAmount: sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount,
      discountReason: sale.discountReason || '',
      receivedAmount: sale.receivedAmount,
      balanceAmount: sale.balanceAmount,
      notes: sale.notes || '',
      itemCount: sale.items?.length || 0,
    }));

    res.json({ sales: formattedSales });
  } catch (err) {
    next(err);
  }
}

// 6.1 Update Sale
export async function updateSale(req, res, next) {
  try {
    const { id } = req.params;
    const { date, items, receivedAmount = 0, notes } = req.body;

    if (!date || !Array.isArray(items) || items.length === 0) {
      return next(createError(400, 'Date and items are required'));
    }

    const sale = await Sale.findById(id).populate('customerId');
    if (!sale) return next(createError(404, 'Sale not found'));

    const customer = sale.customerId;
    if (!customer) return next(createError(404, 'Customer not found'));

    const normalizedItems = [];
    let subtotal = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      if (!item.description?.trim()) {
        return next(createError(400, `Item ${i + 1}: Description is required`));
      }
      if (!item.unit || !['KG', 'Packet'].includes(item.unit)) {
        return next(createError(400, `Item ${i + 1}: Unit must be KG or Packet`));
      }
      if (isNaN(quantity) || quantity <= 0) {
        return next(createError(400, `Item ${i + 1}: Quantity must be greater than 0`));
      }
      if (isNaN(rate) || rate <= 0) {
        return next(createError(400, `Item ${i + 1}: Rate must be greater than 0`));
      }

      const itemAmount = quantity * rate;
      subtotal += itemAmount;

      normalizedItems.push({
        description: item.description.trim(),
        unit: item.unit,
        quantity,
        rate,
        amount: itemAmount,
      });
    }

    const disc = Math.max(0, Number(req.body.discountAmount) || 0);
    if (disc < 0) {
      return next(createError(400, 'Discount cannot be negative'));
    }
    if (disc > subtotal) {
      return next(createError(400, 'Discount cannot exceed subtotal amount'));
    }

    const finalSaleAmount = subtotal - disc;
    const received = Math.max(0, Number(receivedAmount) || 0);

    const previousBalance = await getOutstandingBalanceBefore(customer._id, startOfDay(date), id);
    const totalDue = previousBalance + finalSaleAmount;
    if (received > totalDue) {
      return next(createError(400, `Received amount cannot exceed Total Due (Rs. ${totalDue.toFixed(2)})`));
    }

    const balance = finalSaleAmount - received;
    const saleAmount = finalSaleAmount;
    const balanceAfterSale = previousBalance + saleAmount - received;

    sale.date = startOfDay(date);
    sale.items = normalizedItems;
    sale.totalAmount = subtotal;
    sale.subtotalAmount = subtotal;
    sale.discountAmount = disc;
    sale.finalSaleAmount = finalSaleAmount;
    sale.discountReason = (req.body.discountReason || '').trim();
    sale.receivedAmount = received;
    sale.balanceAmount = balance;
    sale.notes = (notes || '').trim();
    sale.previousBalance = previousBalance;
    sale.saleAmount = saleAmount;
    sale.balanceAfterSale = balanceAfterSale;

    await sale.save();

    await logAction(req.user, {
      action: 'Sale updated',
      description: `Updated sale of Rs. ${subtotal.toFixed(2)} (Paid: Rs. ${received.toFixed(2)}) for customer ${customer.name}`,
      targetType: 'Sale',
      targetId: sale._id,
    });

    res.json({ sale });
  } catch (err) {
    next(err);
  }
}

// 6.2 Delete Sale
export async function deleteSale(req, res, next) {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id).populate('customerId');
    if (!sale) return next(createError(404, 'Sale not found'));

    const customer = sale.customerId;

    await Sale.findByIdAndDelete(id);

    await logAction(req.user, {
      action: 'Sale deleted',
      description: `Deleted sale of Rs. ${sale.totalAmount.toFixed(2)} for customer ${customer?.name || 'Unknown'}`,
      targetType: 'Sale',
      targetId: sale._id,
    });

    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// 6.3 Mark Invoice as Sent
export async function markInvoiceSent(req, res, next) {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id).populate('customerId');
    if (!sale) return next(createError(404, 'Sale not found'));

    const customer = sale.customerId;

    sale.invoiceSentAt = new Date();
    await sale.save();

    await logAction(req.user, {
      action: 'Invoice sent',
      description: `Marked invoice as sent for sale of Rs. ${sale.totalAmount.toFixed(2)} to customer ${customer?.name || 'Unknown'}`,
      targetType: 'Sale',
      targetId: sale._id,
    });

    res.json({ sale });
  } catch (err) {
    next(err);
  }
}


// 7. Record standalone Payment
export async function createPayment(req, res, next) {
  try {
    const { customerId, date, amount, notes } = req.body;

    if (!customerId || !date || !amount) {
      return next(createError(400, 'Customer ID, date, and payment amount are required'));
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return next(createError(404, 'Customer not found'));
    if (!customer.active) return next(createError(400, 'Customer account is disabled'));

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(createError(400, 'Payment amount must be greater than 0'));
    }

    const payment = await Payment.create({
      customerId,
      date: startOfDay(date),
      amount: paymentAmount,
      createdBy: req.user.id,
      notes: (notes || '').trim(),
    });

    await logAction(req.user, {
      action: 'Payment added',
      description: `Recorded payment of Rs. ${paymentAmount.toFixed(2)} for customer ${customer.name}`,
      targetType: 'Payment',
      targetId: payment._id,
    });

    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
}

// 7.1 Update Payment
export async function updatePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { date, amount, notes } = req.body;

    if (!date || !amount) {
      return next(createError(400, 'Date and amount are required'));
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(createError(400, 'Payment amount must be greater than 0'));
    }

    const payment = await Payment.findById(id).populate('customerId');
    if (!payment) return next(createError(404, 'Payment not found'));

    const customer = payment.customerId;
    if (!customer) return next(createError(404, 'Customer not found'));

    payment.date = startOfDay(date);
    payment.amount = paymentAmount;
    payment.notes = (notes || '').trim();

    await payment.save();

    await logAction(req.user, {
      action: 'Payment updated',
      description: `Updated payment of Rs. ${paymentAmount.toFixed(2)} for customer ${customer.name}`,
      targetType: 'Payment',
      targetId: payment._id,
    });

    res.json({ payment });
  } catch (err) {
    next(err);
  }
}

// 7.2 Delete Payment
export async function deletePayment(req, res, next) {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate('customerId');
    if (!payment) return next(createError(404, 'Payment not found'));

    const customer = payment.customerId;

    await Payment.findByIdAndDelete(id);

    await logAction(req.user, {
      action: 'Payment deleted',
      description: `Deleted payment of Rs. ${payment.amount.toFixed(2)} for customer ${customer?.name || 'Unknown'}`,
      targetType: 'Payment',
      targetId: payment._id,
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// 8. Sales Dashboard statistics
export async function getSalesDashboard(req, res, next) {
  try {
    // 1. Count active customers
    const activeCustomersCount = await Customer.countDocuments({ active: true });

    // 2. Compute date boundaries for current month
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 3. Sum sales total amount in this month
    const monthlySalesAgg = await Sale.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ]);

    // 4. Sum received amounts this month (both from sales and standalone payments)
    const monthlySalesReceivedAgg = await Sale.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, totalReceived: { $sum: '$receivedAmount' } } },
    ]);

    const monthlyPaymentsAgg = await Payment.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, totalPayments: { $sum: '$amount' } } },
    ]);

    const totalSalesMonth = monthlySalesAgg[0]?.totalSales || 0;
    const totalReceivedSalesMonth = monthlySalesReceivedAgg[0]?.totalReceived || 0;
    const totalPaymentsStandaloneMonth = monthlyPaymentsAgg[0]?.totalPayments || 0;
    const totalReceivedMonth = totalReceivedSalesMonth + totalPaymentsStandaloneMonth;

    // 5. Total outstanding balance across ALL active customers
    const customers = await Customer.find({ active: true }).select('_id').lean();
    let totalOutstandingLiability = 0;
    for (const cust of customers) {
      const stats = await computeCustomerStats(cust._id);
      if (stats.balance > 0) {
        totalOutstandingLiability += stats.balance;
      }
    }

    res.json({
      activeCustomersCount,
      monthlySalesAmount: totalSalesMonth,
      monthlyReceivedAmount: totalReceivedMonth,
      totalOutstandingLiability,
    });
  } catch (err) {
    next(err);
  }
}

// 9. Get Customer Statement (Sales and Payments within date range)
export async function getCustomerStatement(req, res, next) {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return next(createError(400, 'Start date (from) and end date (to) are required'));
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return next(createError(400, 'Invalid date format'));
    }

    if (fromDate > toDate) {
      return next(createError(400, 'Start date (from) must be less than or equal to end date (to)'));
    }

    const customer = await Customer.findById(id).lean();
    if (!customer) return next(createError(404, 'Customer not found'));

    // 1. Calculate opening balance (outstanding balance just before fromDate)
    const openingBalance = await getOutstandingBalanceBefore(id, startOfDay(fromDate));

    // 2. Fetch sales during period, sorted chronologically
    const sales = await Sale.find({
      customerId: id,
      date: { $gte: startOfDay(fromDate), $lte: endOfDay(toDate) }
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // 3. Fetch standalone payments during period, sorted chronologically
    const payments = await Payment.find({
      customerId: id,
      date: { $gte: startOfDay(fromDate), $lte: endOfDay(toDate) }
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // 4. Calculate period totals
    let periodSales = 0;
    let periodPayments = 0;

    for (const s of sales) {
      periodSales += s.finalSaleAmount !== undefined ? s.finalSaleAmount : s.totalAmount;
      periodPayments += s.receivedAmount || 0; // immediate payment during sale
    }

    for (const p of payments) {
      periodPayments += p.amount || 0; // standalone payment
    }

    const closingBalance = openingBalance + periodSales - periodPayments;

    res.json({
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        place: customer.place,
        notes: customer.notes || '',
        active: customer.active,
        openingBalance: customer.openingBalance || 0,
      },
      period: {
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
      },
      summary: {
        openingBalance,
        totalSales: periodSales,
        totalPayments: periodPayments,
        closingBalance,
      },
      sales: sales.map((s) => ({
        id: s._id.toString(),
        date: s.date,
        items: s.items || [],
        totalAmount: s.totalAmount,
        subtotalAmount: s.subtotalAmount || s.totalAmount || 0,
        discountAmount: s.discountAmount || 0,
        finalSaleAmount: s.finalSaleAmount !== undefined ? s.finalSaleAmount : s.totalAmount,
        discountReason: s.discountReason || '',
        receivedAmount: s.receivedAmount,
        balanceAmount: s.balanceAmount,
        notes: s.notes || '',
      })),
      payments: payments.map((p) => ({
        id: p._id.toString(),
        date: p.date,
        amount: p.amount,
        notes: p.notes || '',
      })),
    });
  } catch (err) {
    next(err);
  }
}

