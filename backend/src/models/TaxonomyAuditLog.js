import mongoose from 'mongoose';

const taxonomyAuditLogSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['class', 'subject'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetName: { type: String, required: true },
    action: { type: String, enum: ['create', 'edit', 'activate', 'deactivate', 'delete', 'soft_delete', 'restore', 'permanent_delete', 'merge'], required: true },
    previousName: { type: String },
    newName: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String },
  },
  { timestamps: true }
);

taxonomyAuditLogSchema.index({ targetId: 1, createdAt: -1 });

export default mongoose.model('TaxonomyAuditLog', taxonomyAuditLogSchema);
