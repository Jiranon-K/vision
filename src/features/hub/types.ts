export interface QuickAction {
  id: string;
  label: string;
  icon: "plus" | "upload" | "chart" | "settings";
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: "dashboard" | "posts" | "analytics" | "settings";
}
