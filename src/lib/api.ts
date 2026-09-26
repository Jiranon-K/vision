// Endpoint calls for auth and settings, until tickets 09 and 14 move them into
// their features. The credential-carrying fetch itself is in @/shared/lib/api.
import { apiFetch, authFetch } from "@/shared/lib/api";

export async function logoutRequest(): Promise<Response> {
  return apiFetch("/api/auth/logout", {
    method: "POST",
  });
}

export async function logoutEverywhereRequest(): Promise<Response> {
  return authFetch("/api/auth/logout-everywhere", {
    method: "POST",
  });
}

// Settings / Profile
export async function getProfileRequest(): Promise<Response> {
  return authFetch("/api/settings/profile");
}

export async function updateProfileRequest(data: {
  name: string;
  bio?: string;
  avatar?: string;
}): Promise<Response> {
  return authFetch("/api/settings/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function changePasswordRequest(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<Response> {
  return authFetch("/api/settings/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getNotificationsRequest(): Promise<Response> {
  return authFetch("/api/settings/notifications");
}

export async function updateNotificationsRequest(data: {
  notifications: {
    email: {
      newComments: boolean;
      newFollowers: boolean;
      weeklyDigest: boolean;
      marketingEmails: boolean;
    };
    push: {
      enabled: boolean;
      postUpdates: boolean;
      systemAlerts: boolean;
    };
    frequency: "daily" | "weekly" | "monthly";
  };
}): Promise<Response> {
  return authFetch("/api/settings/notifications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Auth — public flows
export async function forgotPasswordRequest(email: string): Promise<Response> {
  return apiFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(token: string, newPassword: string): Promise<Response> {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function verifyEmailRequest(token: string): Promise<Response> {
  return apiFetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationRequest(): Promise<Response> {
  return authFetch("/api/auth/resend-verification", {
    method: "POST",
  });
}
