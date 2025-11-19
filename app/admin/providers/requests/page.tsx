// admin/app/providers/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPendingProviders } from "@/app/services/adminProviders";
import type { Provider } from "@/lib/api";
// import { Table, Th, Td } from "../../../components/admin/Table";
import { Table, Th, Td } from "@/app/components/admin/Table";

export default function ProviderRequestsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchPendingProviders();
        if (!mounted) return;
        setProviders(res.providers);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load provider requests");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        All suppliers who have submitted their DED registration form and are
        waiting for admin approval.
      </p>

      {loading && (
        <p className="text-sm text-slate-500">Loading requests…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && providers.length === 0 && (
        <p className="text-sm text-slate-500">
          No pending provider requests right now.
        </p>
      )}

      {!loading && !error && providers.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Supplier</Th>
              <Th>DED License</Th>
              <Th>Service Types</Th>
              <Th>Submitted</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => {
              const submitted = new Date(p.createdAt).toLocaleString();
              return (
                <tr key={p._id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {p.nameOfSupplier || "—"}
                      </span>
                    </div>
                  </Td>
                  <Td>{p.dedLicenseNo}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {p.activities.map((a) => (
                        <span
                          key={a.name + a.code}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td>{submitted}</Td>
                  <Td>
                    <Link
                      href={`/admin/providers/${p._id}`}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Review
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
