import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    subscriberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emailNotify: { type: Boolean, default: true },
    webNotify: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

subscriptionSchema.index({ subscriberRef: 1, teacherRef: 1 }, { unique: true });
subscriptionSchema.index({ teacherRef: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
