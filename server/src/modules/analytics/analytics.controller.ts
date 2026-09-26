import { Response } from 'express';
import mongoose from 'mongoose';
import { creatorTotals } from '../posts';
import { deliveryFigures } from '../followers';
import PostView from './post-view.model';
import { startOfLastDays, startOfUtcDay } from '../../platform/time';
import type { AuthRequest } from '../auth';

const TREND_DAYS = 7;

// Deriving the figures from the Creator's own Posts is what makes them correct
// by construction. They used to come from a platform-wide document, so every
// Creator was shown the whole platform's totals under a heading that said the
// numbers were theirs.
export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { views: totalViews, posts: postCount } = await creatorTotals(
    req.user!.id
  );

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
};

export const getViewsData = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
};

// Growth Analytics' Followers band: the Audience a Creator reaches directly,
// what they delivered to it, and how many Views came back (ADR 0009).
export const getFollowerFigures = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const owner = new mongoose.Types.ObjectId(req.user!.id);
  // One window for every figure in the band, so the share it shows divides
  // like by like: the same UTC days as the weekly View trend.
  const since = startOfLastDays(TREND_DAYS);

  const [figures, views] = await Promise.all([
    deliveryFigures(req.user!.id, since),
    PostView.aggregate<{ total: number }>([
      { $match: { owner, day: { $gte: since } } },
      { $group: { _id: null, total: { $sum: '$fromDelivery' } } },
    ]),
  ]);

  res.json({ ...figures, viewsFromDeliveries: views[0]?.total ?? 0 });
};
