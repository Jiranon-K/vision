"use client";

// PROTOTYPE — the Reader's landing pages (confirmed, link expired, stopped
// following) and the two Follower emails, three variants via ?variant=.
// These have no host page in the app yet, so they live on a throwaway route.

import { PublicPagesPrototype } from "@/features/followers";
import { PrototypeSwitcher, usePrototypeVariant } from "@/shared/ui/prototype-switcher";

export default function FollowersPublicPagesPrototype() {
  const variant = usePrototypeVariant();
  return (
    <main className="min-h-screen bg-background">
      <PublicPagesPrototype variant={variant} />
      <PrototypeSwitcher />
    </main>
  );
}
