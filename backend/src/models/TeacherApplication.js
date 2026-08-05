import mongoose from 'mongoose';

const teacherApplicationSchema = new mongoose.Schema(
  {
    // Applicant reference (if they have an account)
    applicantRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Personal information
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    avatar: { type: String },

    // Education
    education: [
      {
        degree: { type: String },
        institution: { type: String },
        year: { type: String },
        _id: false,
      },
    ],

    // Subjects they want to teach (existing DB subjects & requested new subjects)
    subjects: [{ type: String, trim: true }],
    requestedSubjects: [{ type: String, trim: true }],

    // Teaching experience
    experience: [
      {
        title: { type: String },
        organization: { type: String },
        duration: { type: String },
        _id: false,
      },
    ],

    // Bio & motivation
    bio: { type: String, default: '' },
    motivation: { type: String, default: '' },

    // Application status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // Admin review
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

teacherApplicationSchema.index({ email: 1 });
teacherApplicationSchema.index({ status: 1, createdAt: -1 });
teacherApplicationSchema.index({ applicantRef: 1 });

export default mongoose.model('TeacherApplication', teacherApplicationSchema);
