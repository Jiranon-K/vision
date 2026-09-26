import mongoose, { Document, Schema } from 'mongoose';

// One email of one Delivery to one Follower: the unit the sending queue works.
export interface IDeliverySend extends Document {
  delivery: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  state: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  nextAttemptAt: Date;
  claimedAt?: Date;
  sentAt?: Date;
}

const DeliverySendSchema = new Schema<IDeliverySend>({
  delivery: { type: Schema.Types.ObjectId, ref: 'Delivery', required: true },
  follower: { type: Schema.Types.ObjectId, ref: 'Follower', required: true },
  state: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed'],
    default: 'pending',
  },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, required: true },
  claimedAt: { type: Date },
  sentAt: { type: Date },
});

DeliverySendSchema.index({ delivery: 1, follower: 1 }, { unique: true });
DeliverySendSchema.index({ state: 1, nextAttemptAt: 1 });
DeliverySendSchema.index({ follower: 1, state: 1 });

export default mongoose.model<IDeliverySend>('DeliverySend', DeliverySendSchema);
