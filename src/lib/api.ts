// Endpoint calls for settings, until ticket 14 moves them into the Creators
// feature. The credential-carrying fetch itself is in @/shared/lib/api.
import { authFetch } from "@/shared/lib/api";

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
