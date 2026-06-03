import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'rates' },
    dryMachineRate: { type: Number, required: true, min: 0 },
    nonMachineRate: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
