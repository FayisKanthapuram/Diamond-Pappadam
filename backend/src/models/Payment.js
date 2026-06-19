import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1, date: -1 });
paymentSchema.index({ date: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
