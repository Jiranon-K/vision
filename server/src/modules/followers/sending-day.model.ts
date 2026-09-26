import mongoose, { Document, Schema } from 'mongoose';

// How many Delivery emails have been taken from today's platform-wide limit.
// A counter incremented conditionally is what lets several API instances share
// one limit without overshooting it.
export interface ISendingDay extends Document {
  day: Date;
  used: number;
}

const SendingDaySchema = new Schema<ISendingDay>({
  day: { type: Date, required: true, unique: true },
  used: { type: Number, default: 0 },
});

export default mongoose.model<ISendingDay>('SendingDay', SendingDaySchema);
