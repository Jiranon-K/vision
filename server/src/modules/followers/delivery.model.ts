import mongoose, { Document, Schema } from 'mongoose';

// One Delivery per Post, ever (CONTEXT.md: Delivery). What the email says is
// captured when the Post is delivered, so a later edit cannot change a Delivery
// that is still being sent.
export interface IDelivery extends Document {
  post: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  followers: number;
  email: {
    creatorName: string;
    byline?: string;
    replyTo?: string;
    title: string;
    excerpt: string;
    readTime: string;
    coverImage?: string;
    slug: string;
  };
  createdAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followers: { type: Number, required: true },
    email: {
      creatorName: { type: String, required: true },
      byline: { type: String },
      replyTo: { type: String },
      title: { type: String, required: true },
      excerpt: { type: String, required: true },
      readTime: { type: String, required: true },
      coverImage: { type: String },
      slug: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// "At most once" is this index: a second Delivery for the same Post cannot be
// written, however the publish that asked for it was reached.
DeliverySchema.index({ post: 1 }, { unique: true });
DeliverySchema.index({ creator: 1, createdAt: -1 });

export default mongoose.model<IDelivery>('Delivery', DeliverySchema);
