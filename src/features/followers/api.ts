import { apiFetch } from "@/shared/lib/api";
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

export async function confirmFollow(token: string): Promise<LinkResult> {
  try {
    const res = await apiFetch("/api/followers/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) return { state: "done", outcome: (await res.json()) as FollowOutcome };
    return res.status === 410 ? { state: "expired" } : { state: "failed" };
  } catch {
    return { state: "failed" };
  }
}

export async function stopFollowing(token: string): Promise<LinkResult> {
  try {
    const res = await apiFetch("/api/followers/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return { state: "failed" };
    const data = await res.json();
    return { state: "done", outcome: data.creator ? (data as FollowOutcome) : undefined };
  } catch {
    return { state: "failed" };
  }
}
