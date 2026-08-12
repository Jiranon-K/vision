import mongoose, { Document, Schema } from 'mongoose';

// A daily rollup of Views per Post. The Post document carries a lifetime
// counter, which answers "how many Views" but not "when" — and the weekly trend
// is a per-Creator question, so the owner is denormalised here rather than
// joined back through the Post on every read.
export interface IPostView extends Document {
  post: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  day: Date;
  count: number;
}

const PostViewSchema = new Schema<IPostView>({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // UTC midnight of the day the Views were recorded.
  day: { type: Date, required: true },
  count: { type: Number, default: 0 },
});

PostViewSchema.index({ post: 1, day: 1 }, { unique: true });
PostViewSchema.index({ owner: 1, day: 1 });

export default mongoose.model<IPostView>('PostView', PostViewSchema);

export function startOfUtcDay(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())
  );
}
