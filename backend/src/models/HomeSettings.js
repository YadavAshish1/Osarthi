import mongoose from 'mongoose';

const homeSettingsSchema = new mongoose.Schema(
  {
    // Stats section — manually set marketing numbers
    stats: {
      learners: { type: String, default: '10,000+' },
      insights: { type: String, default: '250+' },
      mentors: { type: String, default: '50+' },
      subjects: { type: String, default: '20+' },
    },
    // Banners for hero carousel (admin-managed, all fields optional)
    banners: [
      {
        tag: { type: String, default: "" },
        title: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        quote: { type: String, default: "" },
        author: { type: String, default: "" },
        ctaText: { type: String, default: "" },
        ctaLink: { type: String, default: "" },
        secondaryCtaText: { type: String, default: "" },
        secondaryCtaLink: { type: String, default: "" },
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

export const DEFAULT_BANNERS = [
  {
    tag: "Free Academic Insights · Written by India's Educators",
    title: "Where curious minds master what truly matters.",
    subtitle: "Deep, concept-first insights and faculty guidance for grades 6–12 & competitive exams.",
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    ctaText: "Explore All Insights",
    ctaLink: "/insights",
    secondaryCtaText: "Find a Teacher",
    secondaryCtaLink: "/teachers",
    bgImage:
      "https://images.unsplash.com/photo-1514241516423-6c0a5e031aa2?auto=format&fit=crop&w=2000&q=85",
    active: true,
    order: 0,
  },
  {
    tag: "Exam Excellence · Board & Foundation Special",
    title: "Score with deep conceptual clarity, not rote memorization.",
    subtitle: "High-yield topic notes, exam question breakdowns, and formula intuition by top educators.",
    quote: "Study without desire spoils the memory, and it retains nothing that it takes in.",
    author: "Leonardo da Vinci",
    ctaText: "Browse Exam Notes",
    ctaLink: "/insights",
    secondaryCtaText: "Find Your Mentor",
    secondaryCtaLink: "/teachers",
    bgImage:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=85&w=1600",
    active: true,
    order: 1,
  },
];

export default mongoose.model('HomeSettings', homeSettingsSchema);
