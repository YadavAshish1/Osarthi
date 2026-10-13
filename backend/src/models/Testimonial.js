import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'Student', trim: true },     // e.g. "Grade 12 Student"
    avatar: { type: String, default: '' },                       // photo URL
    review: { type: String, required: true, trim: true },        // the actual review text
    rating: { type: Number, default: 5, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },                         // for sorting/ordering
  },
  { timestamps: true }
);

export default mongoose.model('Testimonial', testimonialSchema);
