const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

let refreshPromise: Promise<boolean> | null = null;

function toApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function performRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(toApiUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(toApiUrl(path), {
    ...init,
    credentials: "include",
    headers: init.headers,
  });
}

export async function authFetch(
  path: string,
  init: RequestInit = {},
  allowRetry = true
): Promise<Response> {
  const response = await apiFetch(path, init);

  if (response.status !== 401 || !allowRetry) {
    return response;
  }

  const refreshed = await performRefresh();
  if (!refreshed) {
    return response;
  }

  return apiFetch(path, init);
}

export async function logoutRequest(): Promise<Response> {
  return apiFetch("/api/auth/logout", {
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

export async function changePasswordRequest(data: any): Promise<Response> {
  return authFetch("/api/settings/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getNotificationsRequest(): Promise<Response> {
  return authFetch("/api/settings/notifications");
}

export async function updateNotificationsRequest(data: any): Promise<Response> {
  return authFetch("/api/settings/notifications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
