import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['quiz_published', 'insight_published', 'general', 'collection_created', 'teacher_update', 'new_subscriber'],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    quizRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    contentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
    read: { type: Boolean, default: false },
    teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscriberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    collectionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizCollection' },
    link: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
