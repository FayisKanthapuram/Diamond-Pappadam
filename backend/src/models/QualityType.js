import mongoose from 'mongoose';

const qualityTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const QualityType = mongoose.model('QualityType', qualityTypeSchema);
