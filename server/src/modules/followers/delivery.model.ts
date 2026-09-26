import mongoose, { Document, Schema } from 'mongoose';

/** What a Delivery's email says, captured when the Post is delivered. */
export interface DeliveryContent {
  creatorName: string;
  byline?: string;
  title: string;
  excerpt: string;
  readTime: string;
  coverImage?: string;
  slug: string;
}

// One Delivery per Post, ever (CONTEXT.md: Delivery). The content is captured
// at delivery so a later edit cannot change emails that are still queued.
export interface IDelivery extends Document {
  post: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  /** Confirmed Followers when the Post was delivered: the Delivery's reach. */
  followers: number;
  content: DeliveryContent;
  /** Where a Follower's reply goes: the Creator's own address. */
  replyTo?: string;
  createdAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followers: { type: Number, required: true },
    content: {
      creatorName: { type: String, required: true },
      byline: { type: String },
      title: { type: String, required: true },
      excerpt: { type: String, required: true },
      readTime: { type: String, required: true },
      coverImage: { type: String },
      slug: { type: String, required: true },
    },
    replyTo: { type: String },
  },
  { timestamps: true }
);

// "At most once" is this index: a second Delivery for the same Post cannot be
// written, however the publish that asked for it was reached.
DeliverySchema.index({ post: 1 }, { unique: true });
DeliverySchema.index({ creator: 1, createdAt: -1 });

export default mongoose.model<IDelivery>('Delivery', DeliverySchema);
