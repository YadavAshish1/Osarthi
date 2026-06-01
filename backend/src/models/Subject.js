import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, classRef: 1, createdBy: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
