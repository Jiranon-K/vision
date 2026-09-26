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
