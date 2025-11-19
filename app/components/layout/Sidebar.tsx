"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Layers,
  Users,
  ShoppingCart,
  Settings,
  Calendar,
  LayoutGrid,
  ClipboardCheck,
  LogOut,
  type LucideIcon,
} from "lucide-react";

type NavLinkItem = { label: string; icon: LucideIcon; href: Route; action?: undefined };
type NavActionItem = { label: string; icon: LucideIcon; action: "logout"; href?: undefined };
type NavItem = NavLinkItem | NavActionItem;

const nav: NavItem[] = [
  { href: "/" as Route, label: "Dashboard", icon: LayoutGrid },
  { href: "/orders" as Route, label: "Orders", icon: ShoppingCart },
  { href: "/providers" as Route, label: "Providers", icon: ClipboardCheck },
  { href: "/categories" as Route, label: "Categories & Services", icon: Layers },
  { href: "/bookings" as Route, label: "Bookings", icon: Calendar },
  { href: "/customers" as Route, label: "Customers", icon: Users },
  { href: "/settings" as Route, label: "Settings", icon: Settings },
  { action: "logout", label: "Logout", icon: LogOut }, // action item
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    try {
      setSigningOut(true);
      await fetch("/api/auth/signout", { method: "POST" }); // clears cookie server-side
    } catch {
      // ignore
    } finally {
      const next = encodeURIComponent(pathname || "/");
      window.location.href = `/provider/login?next=${next}`;
    }
  }

  const isActive = (href: Route | string) =>
    pathname === href || (href !== "/" && pathname.startsWith(String(href)));

  return (
    <aside className="w-64 bg-sidebar border-r border-border hidden md:flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href={"/" as Route} className="text-xl font-semibold">
         Provider Dashboard
        </Link>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {nav.map((item) => {
          const Icon = item.icon;

          // Action item (logout)
          if (item.action === "logout") {
            return (
              <button
                key="__logout__"
                onClick={logout}
                disabled={signingOut}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-card disabled:opacity-50"
                title="Sign out"
              >
                <Icon size={18} />
                <span>{signingOut ? "Signing out..." : "Logout"}</span>
              </button>
            );
          }

          // Regular link item
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-card ${
                isActive(item.href) ? "bg-card" : ""
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
