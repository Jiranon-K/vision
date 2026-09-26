import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowLinkPage } from "@/features/followers";

// Reached from a link in a Follower email. Never indexed: every URL here
// carries a one-time secret.
export const metadata: Metadata = {
  title: "Stop following",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <FollowLinkPage kind="stop" />
    </Suspense>
  );
}
