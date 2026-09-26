export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
}

export interface ViewsDataPoint {
  label: string;
  value: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export interface EngagementData {
  label: string;
  value: number;
}
