import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    unit: { type: String, enum: ['KG', 'Packet'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const saleSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    items: { type: [saleItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    subtotalAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalSaleAmount: { type: Number, default: 0, min: 0 },
    discountReason: { type: String, trim: true, default: '' },
    receivedAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, default: '' },
    invoiceSentAt: { type: Date },
    previousBalance: { type: Number, default: 0 },
    saleAmount: { type: Number, default: 0 },
    balanceAfterSale: { type: Number, default: 0 },
  },
  { timestamps: true }
);

saleSchema.index({ customerId: 1, date: -1 });
saleSchema.index({ date: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
