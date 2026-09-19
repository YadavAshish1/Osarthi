import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subjectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Soft-delete fields (30-day retention)
    deletedAt: { type: Date, default: null },
    deletedUntil: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Partial unique index: only enforce uniqueness among non-deleted topics
topicSchema.index(
  { name: 1, subjectRef: 1, createdBy: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model('Topic', topicSchema);
