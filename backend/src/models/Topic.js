import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subjectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

topicSchema.index({ name: 1, subjectRef: 1, createdBy: 1 }, { unique: true });

export default mongoose.model('Topic', topicSchema);
