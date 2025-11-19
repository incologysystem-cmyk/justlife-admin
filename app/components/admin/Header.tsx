// admin/components/admin/Header.tsx
"use client";

import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const title =
    pathname === "/"
      ? "Dashboard Overview"
      : pathname.startsWith("/providers/requests")
      ? "Provider Requests"
      : pathname.startsWith("/providers/")
      ? "Provider Details"
      : "Admin";

  return (
    <header className="h-16 border-b flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-slate-900">
          {title}
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Manage suppliers, jobs, and payments for Credible Management.
        </p>
      </div>
      {/* future: user menu / logout */}
    </header>
  );
}
