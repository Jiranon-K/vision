import { apiFetch, authFetch } from "@/shared/lib/api";
import type { FollowOutcome } from "./types";

// The Reader's side of Followers: no session, so plain fetches. Each answers
// with what the page needs to render, or a reason it could not.

export type FollowResult = { ok: true } | { ok: false; message: string };

export async function followCreator(postId: string, email: string): Promise<FollowResult> {
  try {
    const res = await apiFetch("/api/followers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, email }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: false, message: "Too many tries. Please wait a little and try again." };
    const data = await res.json().catch(() => ({}));
    const field = Array.isArray(data.details) ? data.details[0]?.message : undefined;
    return { ok: false, message: field || "That didn't work. Please try again." };
  } catch {
    return { ok: false, message: "Vision can't be reached right now. Please try again." };
  }
}

export type LinkResult =
  | { state: "done"; outcome?: FollowOutcome }
  | { state: "expired" }
  | { state: "failed" };

// Both links in a Follower email spend a one-time token the same way.
async function spendLink(path: string, token: string): Promise<LinkResult> {
  try {
    const res = await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.status === 410) return { state: "expired" };
    if (!res.ok) return { state: "failed" };
    const data = await res.json();
    return { state: "done", outcome: data.creator ? (data as FollowOutcome) : undefined };
  } catch {
    return { state: "failed" };
  }
}

export const confirmFollow = (token: string) => spendLink("/api/followers/confirm", token);
export const stopFollowing = (token: string) => spendLink("/api/followers/stop", token);

/** Downloads the signed-in Creator's Followers as a CSV file. */
export async function downloadFollowersCsv(): Promise<boolean> {
  const res = await authFetch("/api/followers/export");
  if (!res.ok) return false;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "followers.csv";
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
