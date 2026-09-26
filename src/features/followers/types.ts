/** One confirmed Follower as the Creator sees them. */
export interface FollowerRow {
  email: string;
  since: string;
}

export interface FollowerSummary {
  followers: number;
  weeklyGain: number;
  /** Delivery emails the platform can still send today. */
  sendableToday: number;
}

/** Growth Analytics' Followers figures for the last seven days. */
export interface FollowerFigures {
  followers: number;
  weeklyGain: number;
  delivered: number;
  deliveries: number;
  lastDeliveryAt?: string;
  viewsFromDeliveries: number;
  /** Followers at the end of each of the last eight UTC weeks, oldest first. */
  weekly: { weekStart: string; followers: number }[];
}

/** Whom a Reader followed or stopped following, and where they came from. */
export interface FollowOutcome {
  creator: { name: string; byline?: string };
  post: { slug: string; title: string };
}
