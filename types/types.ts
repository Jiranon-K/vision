export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tag: string;
  author: {
    name: string;
    role: string;
  };
  date: string;
  readTime: string;
  featured: boolean;
}

export interface PostRow {
  id: string;
  title: string;
  category: string;
  status: "Published" | "Draft" | "Scheduled";
  date: string;
  views: number;
  readTime: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
}

export interface DashboardPost {
  id: string;
  title: string;
  status: "Published" | "Draft" | "Scheduled";
  views: number;
  date: string;
  category: string;
}

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


export interface AuthUser {
  id: string;
  email: string;
  profile: {
    name: string;
    bio: string;
    avatar: string;
  };
  emailVerified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AuthResponse {
  user: AuthUser;
  message?: string;
}

export interface TokenRefreshResponse {
  user: AuthUser;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}
