import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
    backgroundColor: { type: String },
    color: { type: String },
  },
  { _id: false }
);

const blockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['heading', 'paragraph', 'quote', 'list', 'image', 'video', 'divider'],
      required: true,
    },
    level: { type: Number },
    text: { type: String, default: '' },
    items: [{ type: String }],
    ordered: { type: Boolean, default: false },
    url: { type: String },
    caption: { type: String },
    marks: [markSchema],
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    subjectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled' },
    blocks: [blockSchema],
    published: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

contentSchema.index({ topicRef: 1, createdAt: -1 });

export default mongoose.model('Content', contentSchema);
