import mongoose from 'mongoose';

const quizCollectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['topic', 'weekly', 'monthly', 'custom'], default: 'custom' },
    coverImage: { type: String },
    subjectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    isPublic: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

quizCollectionSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('QuizCollection', quizCollectionSchema);
