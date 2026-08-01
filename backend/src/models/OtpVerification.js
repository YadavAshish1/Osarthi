import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL index: autodelete after 10 mins (600s)
  },
  { timestamps: true }
);

// Index email for quick lookup
otpVerificationSchema.index({ email: 1 });

export default mongoose.model('OtpVerification', otpVerificationSchema);
