import mongoose from 'mongoose';

const salaryPaymentSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true },
    note: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

salaryPaymentSchema.index({ employeeId: 1, date: -1 });
salaryPaymentSchema.index({ createdAt: -1 });

export const SalaryPayment = mongoose.model('SalaryPayment', salaryPaymentSchema);
