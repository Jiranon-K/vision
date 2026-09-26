import { Sidebar, DashboardHeader } from "@/features/hub";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-brand-gray">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <DashboardHeader />
        {children}
      </main>
    </div>
  );
}
