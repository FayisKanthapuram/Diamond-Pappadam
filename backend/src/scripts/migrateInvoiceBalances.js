import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Customer } from '../models/Customer.js';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';

dotenv.config();

async function runMigration() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected.');

  try {
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers. Starting migration...`);

    for (const customer of customers) {
      console.log(`Processing customer: ${customer.name} (${customer._id})`);

      // Find all sales and payments for this customer
      const sales = await Sale.find({ customerId: customer._id });
      const payments = await Payment.find({ customerId: customer._id });

      // Combine into one chronological list
      const txs = [];
      for (const s of sales) {
        txs.push({
          type: 'sale',
          doc: s,
          date: new Date(s.date),
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(s.date),
        });
      }
      for (const p of payments) {
        txs.push({
          type: 'payment',
          doc: p,
          date: new Date(p.date),
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(p.date),
        });
      }

      // Sort oldest first
      txs.sort((a, b) => {
        const dDiff = a.date - b.date;
        if (dDiff !== 0) return dDiff;
        return a.createdAt - b.createdAt;
      });

      let runningBalance = 0;

      for (const tx of txs) {
        if (tx.type === 'sale') {
          const sale = tx.doc;
          const previousBalance = runningBalance;
          const saleAmount = sale.totalAmount;
          const receivedAmount = sale.receivedAmount || 0;
          const balanceAfterSale = previousBalance + saleAmount - receivedAmount;

          // Update the Sale in database
          sale.previousBalance = previousBalance;
          sale.saleAmount = saleAmount;
          sale.balanceAfterSale = balanceAfterSale;

          await sale.save();
          console.log(`  Updated Sale: date=${sale.date.toISOString().slice(0, 10)}, previousBalance=${previousBalance}, saleAmount=${saleAmount}, received=${receivedAmount}, balanceAfterSale=${balanceAfterSale}`);

          // Update running balance with this sale's impact
          runningBalance += (saleAmount - receivedAmount);
        } else {
          // Payment impact
          runningBalance -= tx.doc.amount;
          console.log(`  Processed Payment: date=${tx.doc.date.toISOString().slice(0, 10)}, amount=${tx.doc.amount}`);
        }
      }
      console.log(`Finished customer: ${customer.name}. Final running outstanding balance: ${runningBalance}`);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

runMigration();
