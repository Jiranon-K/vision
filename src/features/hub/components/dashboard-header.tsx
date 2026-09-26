"use client";

import { useAuth } from "@/features/auth";
import UnverifiedEmailBanner from "../../auth/components/unverified-email-banner";

export default function DashboardHeader() {
  const { user } = useAuth(false);
  if (!user || user.emailVerified) return null;
  return <UnverifiedEmailBanner userEmail={user.email} />;
}
