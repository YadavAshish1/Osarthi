import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['single', 'multiple'], default: 'single' },
    options: [optionSchema],
    correctOptionIds: [{ type: String }],
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subjectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    timeLimitMinutes: { type: Number, default: 30 },
    expiresAt: { type: Date },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
