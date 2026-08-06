import mongoose from 'mongoose';

const taxonomyRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['class', 'subject'], required: true },
    name: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    approvedName: { type: String, trim: true },
    adminNote: { type: String, default: '' },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Required if type === 'subject'
    className: { type: String, trim: true }, // Store requested or selected class name
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    adminSuggestion: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taxonomyRequestSchema.index({ requestedBy: 1, createdAt: -1 });
taxonomyRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('TaxonomyRequest', taxonomyRequestSchema);
