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
    subjectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    timeLimitMinutes: { type: Number, default: null },
    hasTimer: { type: Boolean, default: false },
    instructions: { type: String, default: '' },
    expiresAt: { type: Date },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    collectionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizCollection' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: [{ type: String }],
    attemptCount: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
