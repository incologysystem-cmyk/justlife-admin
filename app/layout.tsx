// app/(admin)/layout.tsx
import "@/app/globals.css";
import type { Metadata } from "next";
// import AppShell from "@/components/layout/AppShell";
import AppShell from "./components/layout/AppShell";

export const metadata: Metadata = {
  title: "Justlife Admin",
  description: "Operations dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
