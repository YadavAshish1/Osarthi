import mongoose from 'mongoose';

const seoSettingsSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Medhashine — Learn. Teach. Excel.' },
    description: { type: String, default: 'Interactive learning portal for teachers and students.' },
    keywords: { type: String, default: 'learning, tutoring, blogs, study materials, student portal, medhashine' },
    author: { type: String, default: 'Medhashine Team' },
    googleSiteVerification: { type: String, default: '' },
    robots: { type: String, default: 'index, follow' }
  },
  { timestamps: true }
);

export default mongoose.model('SeoSettings', seoSettingsSchema);
