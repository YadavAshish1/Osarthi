import mongoose from 'mongoose';

const topTeacherCardSchema = new mongoose.Schema(
  {
    headerText: {
      type: String,
      required: true,
      trim: true,
      default: 'Academic Mentor',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    themeColor: {
      type: String,
      default: '#A84C32',
    },
    ctaUrl: {
      type: String,
      default: '',
      trim: true,
    },
    metricCount: {
      type: String,
      default: 'Expert Educator',
    },
    verifiedText: {
      type: String,
      default: 'Verified Mentor',
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('TopTeacherCard', topTeacherCardSchema);
