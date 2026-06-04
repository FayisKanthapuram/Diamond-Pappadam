import mongoose from 'mongoose';
import { PRODUCTION_STATUS, PRODUCTION_ITEM_TYPE, PRODUCTION_METHOD } from '../config/constants.js';

const productionItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(PRODUCTION_ITEM_TYPE),
      required: true,
    },
    method: {
      type: String,
      enum: Object.values(PRODUCTION_METHOD),
      required: true,
    },
    gramTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'GramType', default: null },
    qualityTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'QualityType', default: null },
    specialType: { type: String, trim: true, default: '' },
    kg: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const productionSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    items: { type: [productionItemSchema], default: [] },
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
productionSchema.index({ 'items.gramTypeId': 1 });
productionSchema.index({ 'items.qualityTypeId': 1 });
productionSchema.index({ 'items.method': 1 });

export const Production = mongoose.model('Production', productionSchema);
