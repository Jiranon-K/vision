"use client";

import Link from "next/link";
import type { QuickAction } from "@/types/types";
import { PlusIcon, UploadIcon, ChartIcon, SettingsIcon } from "@/components/ui/Icons";

interface QuickActionButtonProps {
  action: QuickAction;
}

function getActionIcon(iconName: string, className?: string) {
  switch (iconName) {
    case "plus":
      return <PlusIcon className={className} />;
    case "upload":
      return <UploadIcon className={className} />;
    case "chart":
      return <ChartIcon className={className} />;
    case "settings":
      return <SettingsIcon className={className} />;
    default:
      return null;
  }
}

export default function QuickActionButton({ action }: QuickActionButtonProps) {
  return (
    <Link
      href={action.href}
      className="quick-action flex flex-col items-center gap-2 bg-brand-lime rounded-[16px] border-2 border-brand-dark p-4 shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 opacity-0"
    >
      <div className="w-12 h-12 rounded-full bg-brand-dark flex items-center justify-center text-brand-lime">
        {getActionIcon(action.icon)}
      </div>
      <span className="text-sm font-bold text-brand-dark">{action.label}</span>
    </Link>
  );
}
