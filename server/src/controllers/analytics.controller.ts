import { Request, Response } from 'express';
import Analytics from '../models/Analytics';
import Post from '../models/Post';

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    let totalViews = 0;
    let subscribers = 0;
    let engagement = 0;
    let postCount = 0;

    try {
      const latest = await Analytics.findOne().sort({ date: -1 });
      totalViews = latest?.pageViews || 0;
      subscribers = latest?.subscribers || 0;
      engagement = latest?.engagement || 0;
    } catch (err) {
      console.error('Analytics query error:', err);
    }

    try {
      postCount = await Post.countDocuments({ status: 'Published' });
    } catch (err) {
      console.error('Post count error:', err);
    }

    res.json([
      { id: '1', label: 'Total Views', value: `${totalViews}`, change: '0%', changeType: 'positive' },
      { id: '2', label: 'Posts', value: `${postCount}`, change: '0%', changeType: 'positive' },
      { id: '3', label: 'Subscribers', value: `${subscribers}`, change: '0%', changeType: 'positive' },
      { id: '4', label: 'Engagement', value: `${engagement}%`, change: '0%', changeType: 'positive' },
    ]);
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getViewsData = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await Analytics.find()
      .sort({ date: -1 })
      .limit(7);

    const formattedData = data.reverse().map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: item.pageViews,
    }));

    res.json(formattedData.length > 0 ? formattedData : [
      { label: 'Mon', value: 0 },
      { label: 'Tue', value: 0 },
      { label: 'Wed', value: 0 },
      { label: 'Thu', value: 0 },
      { label: 'Fri', value: 0 },
      { label: 'Sat', value: 0 },
      { label: 'Sun', value: 0 },
    ]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};
