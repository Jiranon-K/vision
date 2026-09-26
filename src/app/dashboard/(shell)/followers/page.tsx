"use client";

// PROTOTYPE — the Creator's Followers screen, three variants via ?variant=.
// Mock data only; see Jiranon-K/vision#29.

import { FollowersScreenPrototype } from "@/features/followers";
import { PrototypeSwitcher, usePrototypeVariant } from "@/shared/ui/prototype-switcher";

export default function FollowersPage() {
  const variant = usePrototypeVariant();
  return (
    <>
      <FollowersScreenPrototype variant={variant} />
      <PrototypeSwitcher />
    </>
  );
}
