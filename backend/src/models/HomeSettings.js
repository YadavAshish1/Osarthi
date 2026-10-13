import mongoose from 'mongoose';

const homeSettingsSchema = new mongoose.Schema(
  {
    // Stats section — manually set marketing numbers
    stats: {
      learners: { type: String, default: '500+' },
      insights: { type: String, default: '100+' },
      mentors: { type: String, default: '20+' },
      subjects: { type: String, default: '10+' },
    },
    // Banners for hero carousel (admin-managed)
    banners: [
      {
        tag: { type: String, default: "Featured" },
        title: { type: String, required: true },
        subtitle: { type: String, default: "" },
        quote: { type: String, default: "" },
        author: { type: String, default: "" },
        ctaText: { type: String, default: "Explore Insights" },
        ctaLink: { type: String, default: "/insights" },
        secondaryCtaText: { type: String, default: "Find a Teacher" },
        secondaryCtaLink: { type: String, default: "/teachers" },
        bgImage: { type: String, default: "" },
        active: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    // Optionally pin specific content IDs to appear in Featured Insights swiper
    featuredInsightIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  },
  { timestamps: true }
);

export default mongoose.model('HomeSettings', homeSettingsSchema);
