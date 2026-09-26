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
