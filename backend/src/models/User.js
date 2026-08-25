import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'teacher', 'admin', 'super_admin'], required: true },
    isActive: { type: Boolean, default: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    googleId: { type: String, sparse: true },
    refreshTokenHash: { type: String },
    avatar: { type: String },
    bio: { type: String, default: '' },
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        year: { type: String },
        _id: false,
      },
    ],
    experience: [
      {
        title: { type: String },
        organization: { type: String },
        duration: { type: String },
        _id: false,
      },
    ],
    savedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    likedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    savedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // AI Usage & Quota Tracking
    aiUsage: {
      messagesUsed: { type: Number, default: 0 }, // Used in current quota cycle
      bonusMessages: { type: Number, default: 0 }, // Admin granted or top-up extra messages
      totalLifetimeMessages: { type: Number, default: 0 }, // Lifetime total questions asked
      lastQuotaResetAt: { type: Date, default: Date.now },
      activePlan: { type: String, default: 'free' }, // 'free' | 'starter' | 'pro_monthly' | 'annual_pass'
      planExpiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
