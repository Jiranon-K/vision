"use client";

import { useState, useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import Link from "next/link";
import SettingsTabs from "@/components/dashboard/settings/SettingsTabs";
import ProfileSettings from "@/components/dashboard/settings/ProfileSettings";
import AccountSettings from "@/components/dashboard/settings/AccountSettings";
import NotificationSettings from "@/components/dashboard/settings/NotificationSettings";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications">("profile");
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const { isLoading, isAuthed } = useAuth();

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".settings-header", {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".settings-tabs", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: 100,
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".settings-section", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: stagger(100, { start: 200 }),
              duration: 500,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(page);
    return () => observer.disconnect();
  }, [isAuthed]);

  if (isLoading) {
    return <div className="min-h-screen bg-brand-gray" />;
  }

  return (
    <div ref={pageRef} className="p-8">
      <div className="settings-header opacity-0 mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-brand-dark/60 hover:text-brand-dark transition-colors mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-black text-brand-dark">Settings</h1>
        <p className="text-brand-dark/50 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="settings-tabs opacity-0">
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="settings-content">
        {activeTab === "profile" && <ProfileSettings />}
        {activeTab === "account" && <AccountSettings />}
        {activeTab === "notifications" && <NotificationSettings />}
      </div>
    </div>
  );
}
