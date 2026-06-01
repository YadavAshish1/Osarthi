import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['quiz_published', 'general'], default: 'general' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    quizRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
