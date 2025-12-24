"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchPendingProviders } from "@/app/services/adminProviders";
import type { Provider } from "@/types/provider";
import { Table, Th, Td } from "@/app/components/admin/Table";

type Activity = { name: string; code?: string };

function fmtDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function getProviderId(p: Provider): string {
  const anyP = p as any;
  const id = anyP?._id ?? anyP?.id ?? "";
  return String(id || "");
}

function getActivities(p: Provider): Activity[] {
  const anyP = p as any;
  const list = anyP?.activities;
  return Array.isArray(list) ? (list as Activity[]) : [];
}

export default function ProviderRequestsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchPendingProviders();

        const list = (res as any)?.providers;
        const safe = Array.isArray(list) ? (list as Provider[]) : [];

        if (!mounted) return;
        setProviders(safe);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load provider requests");
        setProviders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const hasData = useMemo(() => providers.length > 0, [providers]);

  return (
    <div className="space-y-4">
      {/* Header + button */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          All suppliers who have submitted their DED registration form and are
          waiting for admin approval.
        </p>

        <Link
          href="/admin/providers/providerlist"
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 transition"
        >
          View All Providers
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading requests…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && !hasData && (
        <p className="text-sm text-slate-500">
          No pending provider requests right now.
        </p>
      )}

      {!loading && !error && hasData && (
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
              const anyP = p as any;

              const pid = getProviderId(p);
              const submitted = fmtDateTime(anyP?.createdAt);

              const supplierName =
                anyP?.nameOfSupplier ??
                anyP?.supplierName ??
                anyP?.name ??
                "—";

              const ded =
                anyP?.dedLicenseNo ??
                anyP?.dedLicense ??
                anyP?.licenseNo ??
                "—";

              const activities = getActivities(p);

              return (
                <tr key={pid || supplierName}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-medium">{supplierName}</span>
                    </div>
                  </Td>

                  <Td>{ded}</Td>

                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {activities.length ? (
                        activities.map((a) => (
                          <span
                            key={(a?.name || "") + (a?.code || "")}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                          >
                            {a?.name || "—"}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </Td>

                  <Td>{submitted}</Td>

                  <Td>
                    {pid ? (
                      <Link
                        href={`/admin/providers/${pid}`}
                        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Review
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
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
