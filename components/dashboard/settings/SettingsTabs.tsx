"use client";

interface SettingsTabsProps {
  activeTab: "profile" | "account" | "notifications";
  onTabChange: (tab: "profile" | "account" | "notifications") => void;
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "account" as const, label: "Account" },
    { id: "notifications" as const, label: "Notifications" },
  ];

  return (
    <div className="flex gap-1 bg-brand-gray rounded-2xl p-1.5 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 rounded-xl font-bold text-base transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-brand-lime text-brand-dark shadow-[2px_2px_0px_0px_#191A23]"
              : "text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
