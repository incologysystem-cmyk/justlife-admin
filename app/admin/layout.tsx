// admin/app/admin/layout.tsx
import type { ReactNode } from "react";
import { Sidebar } from "../components/admin/Sidebar";
import { Header } from "../components/admin/Header";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left sidebar */}
      <Sidebar />

      {/* Right side: header + content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
