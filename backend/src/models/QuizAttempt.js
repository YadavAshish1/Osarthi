import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedOptionIds: [{ type: String }],
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quizRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeTakenSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    suggestions: [{ type: String }],
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quizRef: 1, studentRef: 1 }, { unique: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
