// admin/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsGrid } from "../components/admin/StatsCards";
import { Table, Th, Td } from "../components/admin/Table";
import { fetchPendingProviders } from "../services/adminProviders";
import type { Provider } from "../../types/provider";

export default function AdminDashboardPage() {
  const [pending, setPending] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchPendingProviders();
        if (!mounted) return;
        setPending(res.providers);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load pending providers");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = pending.length;
  const approvedCount = 0; // baad mein real API se la sakte ho

  return (
    <div className="space-y-6">
      <StatsGrid
        pendingProviders={pendingCount}
        approvedProviders={approvedCount}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold">
            Latest Provider Requests
          </h2>
          {/* 🔁 ADMIN providers list route */}
          <Link
            href="/admin/providers/requests"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">
            Loading pending requests…
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && pending.length === 0 && (
          <p className="text-sm text-slate-500">
            No pending provider requests at the moment.
          </p>
        )}

        {!loading && !error && pending.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Supplier</Th>
                <Th>DED License</Th>
                <Th>Submitted</Th>
                <Th>Contact</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {pending.slice(0, 5).map((p) => {
                const user =
                  typeof p.userId === "string" ? undefined : p.userId;
                const supplierName = p.nameOfSupplier || "—";
                const email = user?.email || "—";
                const phone = user?.phoneE164 || "—";
                const submitted = new Date(p.createdAt).toLocaleString();

                return (
                  <tr key={p._id}>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-medium">{supplierName}</span>
                        {user && (
                          <span className="text-xs text-slate-500">
                            By: {(user.firstName || "") +
                              " " +
                              (user.lastName || "")}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>{p.dedLicenseNo}</Td>
                    <Td>{submitted}</Td>
                    <Td>
                      <div className="text-xs">
                        <div>{email}</div>
                        <div>{phone}</div>
                      </div>
                    </Td>
                    <Td>
                      {/* ✅ ADMIN detail route, not provider route */}
                      <Link
                        href={`/admin/providers/${p._id}`}
                        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        View
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
