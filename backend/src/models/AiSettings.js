import mongoose from 'mongoose';

/**
 * AI Settings — stores the system-wide AI configuration.
 * Managed by Super Admin via the admin portal.
 * 
 * NOTE: API keys are strictly loaded from server environment variables (.env)
 * for security. Database only stores provider toggles, sequencing, and rate limits.
 * 
 * Only ONE document exists in this collection (singleton pattern).
 */
const aiSettingsSchema = new mongoose.Schema(
  {
    // Active LLM provider: 'azure_openai' | 'gemini' | 'openai'
    defaultProvider: {
      type: String,
      enum: ['azure_openai', 'gemini', 'openai'],
      default: 'azure_openai',
    },

    // Execution & Fallback Sequencing (order in which models are tried)
    fallbackSequence: {
      type: [String],
      default: ['azure_openai', 'gemini', 'openai'],
    },

    // Provider status toggles and deployment options (NO API KEYS in DB)
    providers: {
      azure_openai: {
        enabled: { type: Boolean, default: true },
        endpoint: { type: String, default: '' },
        deploymentName: { type: String, default: 'gpt-4o' },
        apiVersion: { type: String, default: '2024-10-21' },
      },
      gemini: {
        enabled: { type: Boolean, default: true },
      },
      openai: {
        enabled: { type: Boolean, default: true },
      },
    },

    // Rate limits (per user per hour burst protection)
    rateLimits: {
      student: { type: Number, default: 50 },
      teacher: { type: Number, default: 100 },
      admin: { type: Number, default: 500 },
      super_admin: { type: Number, default: -1 }, // unlimited
    },

    // Default Free Message Quota (Allowed number of messages per person before requiring payment)
    defaultFreeQuota: {
      student: { type: Number, default: 5 },
      teacher: { type: Number, default: 10 },
      admin: { type: Number, default: -1 },
      super_admin: { type: Number, default: -1 },
    },

    // Automated Quota Reset Schedule: 'manual' | 'weekly' | 'monthly'
    quotaResetPeriod: {
      type: String,
      enum: ['manual', 'weekly', 'monthly'],
      default: 'monthly',
    },

    // Timestamp of the last global or bulk quota reset
    lastGlobalResetAt: {
      type: Date,
      default: Date.now,
    },

    // Configurable 3-Tier Paywall Pricing Plans
    pricingPlans: {
      type: [
        {
          id: { type: String, required: true }, // 'starter', 'pro_monthly', 'annual_pass'
          name: { type: String, required: true },
          tag: { type: String, default: '' }, // 'Starter', 'Most Popular', 'Best Value'
          price: { type: Number, required: true }, // Price in INR (₹)
          currency: { type: String, default: 'INR' },
          billingPeriod: { type: String, enum: ['one-time', 'monthly', 'yearly'], default: 'monthly' },
          messageQuota: { type: Number, required: true }, // e.g. 50, 300, 3000
          description: { type: String, default: '' },
          features: [{ type: String }],
          isActive: { type: Boolean, default: true },
          isFeatured: { type: Boolean, default: false },
        },
      ],
      default: [
        {
          id: 'starter',
          name: 'Exam Sprint Pack',
          tag: 'Quick Prep',
          price: 49,
          currency: 'INR',
          billingPeriod: 'one-time',
          messageQuota: 50,
          description: 'Instant boost of 50 AI questions for test & exam preparation.',
          features: [
            '50 Fast AI Doubts & Questions',
            'Full Chapter & Lesson Summaries',
            'Formula & Definition Breakdowns',
            'Valid for 30 Days',
          ],
          isActive: true,
          isFeatured: false,
        },
        {
          id: 'pro_monthly',
          name: 'Pro Scholar Monthly',
          tag: 'Most Popular ⭐',
          price: 149,
          currency: 'INR',
          billingPeriod: 'monthly',
          messageQuota: 300,
          description: 'Comprehensive daily study companion for mastering school curriculum.',
          features: [
            '300 AI Questions per Month (~10/day)',
            'Unlimited Lesson Notes & Q&A Generation',
            'Instant Practice MCQ Generator with Explanations',
            'Priority Fast AI Response Speed',
            'Auto-Cascading High Availability Engine',
          ],
          isActive: true,
          isFeatured: true,
        },
        {
          id: 'annual_pass',
          name: 'Academic Master Annual',
          tag: 'Best Value 🏆',
          price: 699,
          currency: 'INR',
          billingPeriod: 'yearly',
          messageQuota: 3000,
          description: 'Full academic year pass with massive quota & teacher co-author studio.',
          features: [
            '3,000 AI Questions for Full Academic Year',
            'Full Syllabus & Board Exam Study Copilot',
            'Educator Studio & Lesson Co-Authoring Access',
            'Zero Rate Limits & Dedicated Bandwidth',
            'Save >60% compared to monthly pass',
          ],
          isActive: true,
          isFeatured: false,
        },
      ],
    },

    // RAG settings
    ragEnabled: { type: Boolean, default: true },

    // Payment Gateway Settings (Razorpay, UPI, Test)
    paymentGateway: {
      provider: { type: String, enum: ['razorpay', 'test', 'custom_upi'], default: 'razorpay' },
      razorpayKeyId: { type: String, default: process.env.RAZORPAY_KEY_ID || 'rzp_test_medhashine_ai' },
      razorpayKeySecret: { type: String, default: process.env.RAZORPAY_KEY_SECRET || '' },
      upiId: { type: String, default: 'medhashine@okhdfcbank' },
      isLive: { type: Boolean, default: false },
    },

    // Azure Ops settings (for Super Admin infrastructure tools)
    azureOps: {
      subscriptionId: { type: String, default: '' },
      resourceGroup: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('AiSettings', aiSettingsSchema);
