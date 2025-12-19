// components/layout/AppShell.tsx
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const ADMIN_PREFIXES = [
  "/",           // dashboard root
  "/orders",
  "/providers",
  "/categories",
  "/bookings",
  "/customers",
  "/settings",
  "/addons",
  "/providers",
  "/promocodes",
  "/finance"
];

// returns true if pathname is exactly "/" or starts with any allowed prefix (except "/" which must be exact)
function isAdminRoute(pathname: string) {
  if (pathname === "/") return true;
  return ADMIN_PREFIXES
    .filter((p) => p !== "/")
    .some((p) => pathname.startsWith(p));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChrome = isAdminRoute(pathname);

  if (!showChrome) {
    // Auth pages and anything else outside admin: render content without sidebar/topbar
    return <main className="p-6 space-y-6">{children}</main>;
  }

  // Admin routes: render with sidebar + topbar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
