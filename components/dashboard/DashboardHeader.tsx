"use client";

import { useAuth } from "@/hooks/useAuth";
import UnverifiedEmailBanner from "./UnverifiedEmailBanner";

export default function DashboardHeader() {
  const { user } = useAuth(false);
  if (!user || user.emailVerified) return null;
  return <UnverifiedEmailBanner userEmail={user.email} />;
}
