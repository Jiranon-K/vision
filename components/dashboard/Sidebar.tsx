"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { sidebarNavItems } from "@/lib/constants";
import { logoutRequest } from "@/lib/api";
import { 
  DashboardIcon, 
  PostsIcon, 
  AnalyticsIcon, 
  SettingsIcon, 
  LogoIcon, 
  LogoutIcon, 
  HomeIcon 
} from "@/components/ui/Icons";

function getIcon(iconName: string, className?: string) {
  switch (iconName) {
    case "dashboard":
      return <DashboardIcon className={className} />;
    case "posts":
      return <PostsIcon className={className} />;
    case "analytics":
      return <AnalyticsIcon className={className} />;
    case "settings":
      return <SettingsIcon className={className} />;
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {

    }
    router.replace("/login");
  };

  return (
    <aside className="sidebar-nav fixed left-0 top-0 h-screen w-64 bg-brand-dark z-40 flex flex-col">
      
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon />
          <span className="text-2xl font-bold text-white">Vision</span>
        </Link>
      </div>

      
      <nav className="p-4 space-y-2 flex-1">
        {sidebarNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-brand-lime text-brand-dark font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {getIcon(item.icon, isActive ? "text-brand-dark" : "text-current")}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      
      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>

        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <HomeIcon />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}
