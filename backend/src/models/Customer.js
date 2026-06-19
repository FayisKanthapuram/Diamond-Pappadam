import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
    openingBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
