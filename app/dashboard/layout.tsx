import QueryProvider from "@/components/dashboard/QueryProvider";

// Wraps every screen under /dashboard, not just the ones inside the (shell)
// group: the editor lives outside it and still has to invalidate the Posts list
// and the analytics its saves affect.
export default function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <QueryProvider>{children}</QueryProvider>;
}
