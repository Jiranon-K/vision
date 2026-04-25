import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tag: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  author: {
    name: string;
    role: string;
  };
  date: Date;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    tag: { type: String, required: true },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Scheduled'],
      default: 'Draft',
    },
    author: {
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    date: { type: Date, default: Date.now },
    readTime: { type: String, required: true },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ category: 1 });
PostSchema.index({ featured: 1 });

export default mongoose.model<IPost>('Post', PostSchema);
