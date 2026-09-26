import mongoose, { Document, Schema } from 'mongoose';

// One Delivery's email to one Follower: the unit the Delivery queue works.
export interface IQueuedEmail extends Document {
  delivery: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  /** Denormalised from the Delivery so Growth Analytics can count by Creator. */
  creator: mongoose.Types.ObjectId;
  state: 'waiting' | 'claimed' | 'sent' | 'failed';
  attempts: number;
  dueAt: Date;
  claimedAt?: Date;
  sentAt?: Date;
}

const QueuedEmailSchema = new Schema<IQueuedEmail>({
  delivery: { type: Schema.Types.ObjectId, ref: 'Delivery', required: true },
  follower: { type: Schema.Types.ObjectId, ref: 'Follower', required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  state: { type: String, enum: ['waiting', 'claimed', 'sent', 'failed'], default: 'waiting' },
  attempts: { type: Number, default: 0 },
  dueAt: { type: Date, required: true },
  claimedAt: { type: Date },
  sentAt: { type: Date },
});

QueuedEmailSchema.index({ delivery: 1, follower: 1 }, { unique: true });
QueuedEmailSchema.index({ state: 1, dueAt: 1 });
QueuedEmailSchema.index({ follower: 1, state: 1 });
QueuedEmailSchema.index({ creator: 1, state: 1, sentAt: 1 });

export default mongoose.model<IQueuedEmail>('QueuedEmail', QueuedEmailSchema);
