"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarNavItems } from "@/lib/constants";
import {
  DashboardIcon,
  PostsIcon,
  AnalyticsIcon,
  SettingsIcon,
  LogoIcon,
} from "@/components/ui/Icons";

// The editor keeps the dashboard's navigation, collapsed to icons — the
// design shows the 72px rail beside the writing surface at every width above
// mobile, so the Creator is still somewhere in the product rather than on a
// page that dropped them out of it. Only the phone drops it, where 72px is
// a fifth of the screen.
//
// `dark` is forced on this element: the rail carries its own fixed dark
// context in both themes (the design's token table calls it out by name),
// which the class does by remapping the semantic layer — never by reaching
// for a primitive.
const ICONS: Record<string, (props: { className?: string }) => React.ReactNode> = {
  dashboard: DashboardIcon,
  posts: PostsIcon,
  analytics: AnalyticsIcon,
  settings: SettingsIcon,
};

export default function EditorRail() {
  const pathname = usePathname();

  return (
    <aside className="dark hidden w-[72px] shrink-0 flex-col bg-background sm:flex">
      <div className="flex h-16 items-center justify-center border-b border-border-subtle">
        <Link href="/dashboard" aria-label="Vision dashboard">
          <LogoIcon className="text-brand-lime" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 py-2.5">
        {sidebarNavItems.map((item) => {
          const Icon = ICONS[item.icon];
          // /dashboard/posts owns the editor routes beneath it, so the rail
          // marks Posts active while a Post is open — matching where the
          // Creator actually is rather than the exact URL.
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`mx-auto flex size-11 items-center justify-center rounded-xl transition-opacity ${
                active
                  ? "bg-accent text-text-on-brand"
                  : "text-foreground opacity-60 hover:opacity-100"
              }`}
            >
              {Icon ? <Icon className="size-5" /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
