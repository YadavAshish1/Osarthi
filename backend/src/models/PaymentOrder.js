import mongoose from 'mongoose';

/**
 * Payment Order Model — records subscription orders, test/live transactions,
 * and user plan upgrades.
 */
const paymentOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true, // 'starter' | 'pro_monthly' | 'annual_pass'
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: 'INR',
    },
    messageQuotaGranted: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentGateway: {
      type: String,
      default: 'razorpay_direct', // or 'stripe', 'mock_gateway'
    },
    gatewayOrderId: {
      type: String,
    },
    gatewayPaymentId: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('PaymentOrder', paymentOrderSchema);
