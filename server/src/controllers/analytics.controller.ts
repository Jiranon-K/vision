import { Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import PostView, { startOfUtcDay } from '../models/PostView';
import { AuthRequest } from '../middleware/auth';

const TREND_DAYS = 7;

// Deriving the figures from the Creator's own Posts is what makes them correct
// by construction. They used to come from a platform-wide document, so every
// Creator was shown the whole platform's totals under a heading that said the
// numbers were theirs.
export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const owner = new mongoose.Types.ObjectId(req.user!.id);

    const [viewAgg, postCount] = await Promise.all([
      Post.aggregate<{ total: number }>([
        { $match: { owner, status: 'Published' } },
        { $group: { _id: null, total: { $sum: '$views' } } },
      ]),
      Post.countDocuments({ owner }),
    ]);

    const totalViews = viewAgg[0]?.total ?? 0;

    // Subscribers and Engagement are absent on purpose. Neither has a
    // per-Creator definition, and a plausible-looking number that describes
    // someone else is worse than no number at all.
    res.json([
      {
        id: 'views',
        label: 'Total Views',
        value: `${totalViews}`,
        change: '0%',
        changeType: 'positive',
      },
      {
        id: 'posts',
        label: 'Posts',
        value: `${postCount}`,
        change: '0%',
        changeType: 'positive',
      },
    ]);
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getViewsData = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const owner = new mongoose.Types.ObjectId(req.user!.id);

    const today = startOfUtcDay(new Date());
    const days: Date[] = [];
    for (let back = TREND_DAYS - 1; back >= 0; back--) {
      days.push(new Date(today.getTime() - back * 24 * 60 * 60 * 1000));
    }

    const rows = await PostView.aggregate<{ _id: Date; total: number }>([
      { $match: { owner, day: { $gte: days[0] } } },
      { $group: { _id: '$day', total: { $sum: '$count' } } },
    ]);

    const byDay = new Map(rows.map((r) => [new Date(r._id).getTime(), r.total]));

    // A day with no Views is a point worth zero, not a missing point: a gap
    // would make the chart's x-axis move under the Creator week to week.
    res.json(
      days.map((day) => ({
        label: day.toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: 'UTC',
        }),
        value: byDay.get(day.getTime()) ?? 0,
      }))
    );
  } catch (error) {
    console.error('getViewsData error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
