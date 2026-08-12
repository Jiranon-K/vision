import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'Published' | 'Draft';
  owner: mongoose.Types.ObjectId;
  author: {
    name: string;
    role: string;
  };
  date: Date;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
  /**
   * Addresses this Post used to be readable at. Retained so a link a Reader
   * saved keeps working, and included in uniqueness so a released address can
   * never start pointing at a different Creator's Post.
   */
  previousSlugs: string[];
  coverImage?: string;
  /** Supplied by `timestamps: true`; declared so the cursor can read it. */
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['Published', 'Draft'],
      default: 'Draft',
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    author: {
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    date: { type: Date, default: Date.now },
    readTime: { type: String, required: true },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    slug: { type: String, required: true, unique: true },
    previousSlugs: { type: [String], default: [] },
    coverImage: { type: String },
  },
  { timestamps: true }
);

PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ category: 1 });
PostSchema.index({ featured: 1 });
PostSchema.index({ owner: 1, createdAt: -1 });
PostSchema.index({ previousSlugs: 1 });

// Search was an unanchored case-insensitive $regex over titles: no index could
// answer it, so every search read every Post, matched substrings without regard
// for words, and could not rank. A text index buys indexed word matching and a
// relevance score.
//
// `default_language: 'none'` disables stemming and stop-word removal. English
// stemming would silently discard Thai — the language a good deal of this
// platform's content is written in — and a Creator finding nothing is worse
// than a Creator finding an unstemmed match.
PostSchema.index(
  { title: 'text', excerpt: 'text', content: 'text' },
  {
    weights: { title: 10, excerpt: 4, content: 1 },
    default_language: 'none',
    name: 'post_search',
  }
);

export default mongoose.model<IPost>('Post', PostSchema);
