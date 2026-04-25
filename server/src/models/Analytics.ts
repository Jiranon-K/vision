import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  date: Date;
  pageViews: number;
  posts: {
    postId: mongoose.Types.ObjectId;
    views: number;
  }[];
  subscribers: number;
  engagement: number;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    date: { type: Date, default: Date.now },
    pageViews: { type: Number, default: 0 },
    posts: [
      {
        postId: { type: Schema.Types.ObjectId, ref: 'Post' },
        views: { type: Number, default: 0 },
      },
    ],
    subscribers: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
