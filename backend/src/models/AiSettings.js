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

    // Rate limits (per user per hour)
    rateLimits: {
      student: { type: Number, default: 50 },
      teacher: { type: Number, default: 100 },
      admin: { type: Number, default: 500 },
      super_admin: { type: Number, default: -1 }, // unlimited
    },

    // RAG settings
    ragEnabled: { type: Boolean, default: true },

    // Azure Ops settings (for Super Admin infrastructure tools)
    azureOps: {
      subscriptionId: { type: String, default: '' },
      resourceGroup: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('AiSettings', aiSettingsSchema);
