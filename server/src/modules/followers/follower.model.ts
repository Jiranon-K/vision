import mongoose, { Document, Schema } from 'mongoose';

// A Reader's address held for one Creator (CONTEXT.md: Follower). Pending until
// the Reader confirms it; only a confirmed record is a Follower.
export interface IFollower extends Document {
  creator: mongoose.Types.ObjectId;
  email: string;
  state: 'pending' | 'confirmed';
  /** Hash of the confirmation token; the token itself only ever exists in the email. */
  confirmTokenHash?: string;
  confirmExpiresAt?: Date;
  confirmedAt?: Date;
  /** The secret in every Delivery's stop link. Stopping is its only power. */
  stopToken: string;
  /** Where the Reader followed from, so confirming can send them back to it. */
  source: { slug: string; title: string };
  createdAt: Date;
}

const FollowerSchema = new Schema<IFollower>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    state: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
    confirmTokenHash: { type: String },
    confirmExpiresAt: { type: Date },
    confirmedAt: { type: Date },
    stopToken: { type: String, required: true },
    source: {
      slug: { type: String, required: true },
      title: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// One record per Creator and address: the index, not a read-then-write, is
// what keeps a Reader from becoming two Followers of the same Creator.
FollowerSchema.index({ creator: 1, email: 1 }, { unique: true });
FollowerSchema.index({ creator: 1, state: 1, confirmedAt: -1 });
FollowerSchema.index({ confirmTokenHash: 1 }, { sparse: true });
FollowerSchema.index({ stopToken: 1 }, { unique: true });

export default mongoose.model<IFollower>('Follower', FollowerSchema);
