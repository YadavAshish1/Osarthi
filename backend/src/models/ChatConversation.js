import mongoose from 'mongoose';

/**
 * Chat Conversation — stores multi-turn AI chat history.
 * 
 * Each conversation belongs to a user and contains an array of messages.
 * Addresses Verification Report Issue #3: the original plan had no
 * conversation storage design.
 */
const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['human', 'ai', 'system', 'tool'],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    additional_kwargs: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'super_admin'],
      required: true,
    },
    modelProvider: {
      type: String,
      enum: ['azure_openai', 'gemini', 'openai'],
      default: 'azure_openai',
    },
    title: { type: String, default: 'New Chat' },
    messages: [chatMessageSchema],
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for efficient user conversation listing
chatConversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('ChatConversation', chatConversationSchema);
