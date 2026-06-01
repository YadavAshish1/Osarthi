import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    googleId: { type: String, sparse: true },
    refreshTokenHash: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
