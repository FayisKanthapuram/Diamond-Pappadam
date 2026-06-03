import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    totalDryMachineKg: { type: Number, required: true, min: 0, default: 0 },
    totalNonMachineKg: { type: Number, required: true, min: 0, default: 0 },
    totalKg: { type: Number, required: true, min: 0, default: 0 },
    totalEarnings: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paymentDate: { type: Date },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = mongoose.model('Payroll', payrollSchema);
