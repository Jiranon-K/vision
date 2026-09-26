import { type AccountRole } from "@/features/auth";

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
