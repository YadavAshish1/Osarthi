import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['student', 'educator', 'other'], default: 'student' },
    category: { type: String, enum: ['technical', 'verification', 'account', 'content', 'other'], default: 'technical' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responseMessage: { type: String, default: '' },
    adminNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: String, default: 'Admin' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('SupportTicket', supportTicketSchema);
