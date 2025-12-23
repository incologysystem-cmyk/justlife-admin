"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Layers,
  Users,
  ShoppingCart,
  Calendar,
  LayoutGrid,
  ClipboardCheck,
  LogOut,
  Clock,
  TicketPercent,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type NavLinkItem = {
  label: string;
  icon: LucideIcon;
  href: Route;
  action?: undefined;
};

type NavActionItem = {
  label: string;
  icon: LucideIcon;
  action: "logout";
  href?: undefined;
};

type NavItem = NavLinkItem | NavActionItem;

const nav: NavItem[] = [
  { href: "/" as Route, label: "Dashboard", icon: LayoutGrid },
  { href: "/orders" as Route, label: "Orders", icon: ShoppingCart },
  { href: "/addons" as Route, label: "Add-ons", icon: ClipboardCheck },
  { href: "/categories" as Route, label: "Categories & Services", icon: Layers },
  { href: "/bookings" as Route, label: "Bookings", icon: Calendar },
  { href: "/customers" as Route, label: "Customers", icon: Users },

  // ✅ Availability (fixed spelling + proper icon)
  { href: "/availability" as Route, label: "Availability", icon: Clock },

  // ✅ Dedicated business icons
  {
    href: "/promocodes" as Route,
    label: "Promocodes & Discounts",
    icon: TicketPercent,
  },
  {
    href: "/finance" as Route,
    label: "Payments & Payouts",
    icon: Wallet,
  },

  { action: "logout", label: "Logout", icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    try {
      setSigningOut(true);
      await fetch("/api/auth/signout", { method: "POST" });
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
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href={"/" as Route} className="text-xl font-semibold">
          Provider Dashboard
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        {nav.map((item) => {
          const Icon = item.icon;

          // 🔴 Logout action
          if (item.action === "logout") {
            return (
              <button
                key="__logout__"
                onClick={logout}
                disabled={signingOut}
                type="button"
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-card disabled:opacity-50"
              >
                <Icon size={18} />
                <span>{signingOut ? "Signing out..." : "Logout"}</span>
              </button>
            );
          }

          // 🔵 Normal nav link
          return (
            <Link
              key={String(item.href)}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-card transition ${
                isActive(item.href) ? "bg-card font-medium" : ""
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
