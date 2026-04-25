"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getNotificationsRequest, updateNotificationsRequest } from "@/lib/api";
import { toast } from "sonner";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between p-4 bg-brand-gray/50 rounded-xl transition-all duration-200 ${
      disabled ? "opacity-50 pointer-events-none" : "hover:bg-brand-gray/80"
    }`}>
      <div>
        <p className="font-bold text-brand-dark">{label}</p>
        <p className="text-sm text-brand-dark/50">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative w-14 h-8 rounded-full transition-colors duration-200 border-2 ${
          enabled ? "bg-brand-lime border-brand-dark" : "bg-white border-brand-dark/20"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-brand-dark transition-transform duration-200 ${
            enabled ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState({
    newComments: true,
    newFollowers: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  const [pushNotifications, setPushNotifications] = useState({
    enabled: true,
    postUpdates: true,
    systemAlerts: true,
  });

  const [emailFrequency, setEmailFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await getNotificationsRequest();
        if (res.ok) {
          const data = await res.json();
          const prefs = {
            email: data.email || emailNotifications,
            push: data.push || pushNotifications,
            frequency: data.frequency || emailFrequency,
          };
          setEmailNotifications(prefs.email);
          setPushNotifications(prefs.push);
          setEmailFrequency(prefs.frequency);
          setInitialData(prefs);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast.error("Failed to load notification settings.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return (
      JSON.stringify(emailNotifications) !== JSON.stringify(initialData.email) ||
      JSON.stringify(pushNotifications) !== JSON.stringify(initialData.push) ||
      emailFrequency !== initialData.frequency
    );
  }, [emailNotifications, pushNotifications, emailFrequency, initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          frequency: emailFrequency,
        },
      };
      const res = await updateNotificationsRequest(payload);
      if (res.ok) {
        toast.success("Notification preferences updated!");
        setInitialData(payload.notifications);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update notifications");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardContent className="p-10 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-lime border-2 border-brand-dark flex items-center justify-center shadow-[2px_2px_0px_0px_#191A23]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl font-black text-brand-dark">Email Notifications</CardTitle>
              <CardDescription className="text-brand-dark/50">
                Manage how we contact you via email.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            enabled={emailNotifications.newComments}
            onChange={(v) => setEmailNotifications({ ...emailNotifications, newComments: v })}
            label="New Comments"
            description="Get notified when someone comments on your posts."
          />
          <Toggle
            enabled={emailNotifications.newFollowers}
            onChange={(v) => setEmailNotifications({ ...emailNotifications, newFollowers: v })}
            label="New Followers"
            description="Get notified when someone follows you."
          />
          <Toggle
            enabled={emailNotifications.weeklyDigest}
            onChange={(v) => setEmailNotifications({ ...emailNotifications, weeklyDigest: v })}
            label="Weekly Digest"
            description="Receive a weekly summary of your content performance."
          />
          <Toggle
            enabled={emailNotifications.marketingEmails}
            onChange={(v) => setEmailNotifications({ ...emailNotifications, marketingEmails: v })}
            label="Marketing Emails"
            description="Receive updates about new features and promotions."
          />
        </CardContent>
      </Card>

      
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-lime border-2 border-brand-dark flex items-center justify-center shadow-[2px_2px_0px_0px_#191A23]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-brand-dark">Push Notifications</CardTitle>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  pushNotifications.enabled ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {pushNotifications.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <CardDescription className="text-brand-dark/50">
                Configure real-time alerts on your devices.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            enabled={pushNotifications.enabled}
            onChange={(v) => setPushNotifications({ ...pushNotifications, enabled: v })}
            label="Allow Push Notifications"
            description="Main switch for all push notification services."
          />
          <div className="ml-4 pl-4 border-l-2 border-brand-dark/5 space-y-3 mt-3">
            <Toggle
              enabled={pushNotifications.postUpdates}
              onChange={(v) => setPushNotifications({ ...pushNotifications, postUpdates: v })}
              label="Post Updates"
              description="Get notified about activity on your posts."
              disabled={!pushNotifications.enabled}
            />
            <Toggle
              enabled={pushNotifications.systemAlerts}
              onChange={(v) => setPushNotifications({ ...pushNotifications, systemAlerts: v })}
              label="System Alerts"
              description="Receive important system notifications."
              disabled={!pushNotifications.enabled}
            />
          </div>
        </CardContent>
      </Card>

      
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-lime border-2 border-brand-dark flex items-center justify-center shadow-[2px_2px_0px_0px_#191A23]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl font-black text-brand-dark">Email Frequency</CardTitle>
              <CardDescription className="text-brand-dark/50">
                How often should we send you email updates?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(["daily", "weekly", "monthly"] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setEmailFrequency(freq)}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm capitalize transition-all duration-200 border-2 ${
                  emailFrequency === freq
                    ? "bg-brand-lime text-brand-dark border-brand-dark shadow-[4px_4px_0px_0px_#191A23]"
                    : "bg-brand-gray text-brand-dark/50 border-transparent hover:border-brand-dark/20 disabled:opacity-50"
                }`}
              >
                {emailFrequency === freq && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {freq}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      
      <div className="pt-2">
        <Button onClick={handleSave} size="lg" disabled={isSaving || !isDirty}>
          {isSaving ? "Saving..." : !isDirty ? "No Changes" : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
