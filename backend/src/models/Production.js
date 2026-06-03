import mongoose from 'mongoose';
import { PRODUCTION_STATUS } from '../config/constants.js';

const productionSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    dryMachineKg: { type: Number, required: true, min: 0, default: 0 },
    nonMachineKg: { type: Number, required: true, min: 0, default: 0 },
    dryMachineRate: { type: Number, required: true, min: 0 },
    nonMachineRate: { type: Number, required: true, min: 0 },
    dryMachineAmount: { type: Number, required: true, min: 0 },
    nonMachineAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    bonusAmount: { type: Number, default: 0, min: 0 },
    deductionAmount: { type: Number, default: 0, min: 0 },
    adjustmentReason: { type: String, trim: true, default: '' },
    netAmount: { type: Number, default: 0, min: 0 },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adjustedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: Object.values(PRODUCTION_STATUS),
      default: PRODUCTION_STATUS.PENDING,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

productionSchema.index({ employeeId: 1, date: -1 });
productionSchema.index({ createdAt: -1 });
productionSchema.index({ status: 1, date: -1 });

export const Production = mongoose.model('Production', productionSchema);
