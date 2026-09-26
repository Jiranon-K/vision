// Fall back to the local backend rather than "" — the same base the server-side
// fetches in server.ts use.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Fire-and-forget view counter (client-side beacon). Swallows all errors —
// a failed view ping must never surface to the reader.
export async function incrementPostViews(id: string, source?: "delivery"): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/posts/${encodeURIComponent(id)}/view`, {
      method: "POST",
      keepalive: true,
      ...(source
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source }) }
        : {}),
    });
  } catch {
    // ignore
  }
}
