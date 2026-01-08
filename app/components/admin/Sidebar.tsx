"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Providers", href: "/admin/providers/requests" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Jobs / Orders", href: "/admin/jobs" },
    { label: "Service Request", href: "/admin/services/requests" },

];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // ✅ typed-route safe
      router.push("/admin/login" as Route);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-white/80 backdrop-blur">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <span className="font-bold text-xl tracking-tight">
          Credible<span className="text-blue-600">Admin</span>
        </span>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={(item.href as unknown) as Route}
              className={`flex items-center px-5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700 border-r-4 border-blue-500"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.icon ? <span className="mr-2">{item.icon}</span> : null}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="border-t px-5 py-4">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full text-left text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition disabled:opacity-60"
        >
          {loading ? "Logging out…" : "Logout"}
        </button>

        <div className="text-xs text-slate-400 mt-3">
          © {new Date().getFullYear()} Credible Management
        </div>
      </div>
    </aside>
  );
}
