import type { QuickAction, NavItem } from "@/types/types";

export const sidebarNavItems: NavItem[] = [
  { id: "1", label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { id: "2", label: "Posts", href: "/dashboard/posts", icon: "posts" },
  { id: "3", label: "Analytics", href: "/dashboard/analytics", icon: "analytics" },
  { id: "4", label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

export const quickActions: QuickAction[] = [
  { id: "1", label: "New Post", icon: "plus", href: "/dashboard/posts/new" },
  { id: "2", label: "Upload Media", icon: "upload", href: "/dashboard/media" },
  { id: "3", label: "View Analytics", icon: "chart", href: "/dashboard/analytics" },
];

export const categories = [
  "All",
  "Marketing",
  "SEO",
  "Content",
  "Social Media",
  "Analytics",
  "Branding",
];

export const statusFilters = ["All", "Published", "Draft", "Scheduled"] as const;
