import type { PostSummary } from "./contract";

export interface PostRow extends Pick<PostSummary, "withheld" | "permissions" | "delivery"> {
  id: string;
  title: string;
  category: string;
  status: "Published" | "Draft";
  date: string;
  views: number;
  readTime: string;
}

export interface DashboardPost {
  id: string;
  title: string;
  status: "Published" | "Draft";
  views: number;
  date: string;
  category: string;
}
