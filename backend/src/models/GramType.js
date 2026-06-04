import mongoose from 'mongoose';

const gramTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GramType = mongoose.model('GramType', gramTypeSchema);
