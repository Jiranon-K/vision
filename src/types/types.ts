import { type PostCreator } from "@/features/posts";
import { type AccountRole } from "@/features/auth";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  author: PostCreator;
  date: string;
  readTime: string;
  featured: boolean;
}

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

export interface AuthUser {
  id: string;
  email: string;
  role: AccountRole;
  profile: {
    name: string;
    bio: string;
    avatar: string;
    byline: string;
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
