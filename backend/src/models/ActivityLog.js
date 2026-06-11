import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    description: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
