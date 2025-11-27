// app/provider/customers/[customerId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DataTable from "@/app/components/tables/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import {
  fetchProviderCustomerHistory,
  type CustomerHistoryPayload,
  type CustomerHistoryBooking,
} from "@/app/services/providerCustomers";


function formatDate(input?: string) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function ProviderCustomerHistoryPage() {
  const params = useParams<{ customerId: string }>();
  const rawId = params?.customerId;
  const customerId = (rawId || "").toString().trim();

  const [data, setData] = useState<CustomerHistoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId || customerId === "undefined" || customerId === "null") {
      setError("Invalid customer id in URL");
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const payload = await fetchProviderCustomerHistory(customerId);
        if (!mounted) return;
        setData(payload);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load customer history");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  const previous = data?.previous ?? [];
  const upcoming = data?.upcoming ?? [];
  const stats = data?.stats;

  const columns: ColumnDef<CustomerHistoryBooking>[] = useMemo(
    () => [
      {
        header: "Service",
        accessorKey: "serviceName",
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-900">
                {b.serviceName}
              </span>
              {b.schedule?.timeSlot && (
                <span className="text-[11px] text-slate-500">
                  Slot: {b.schedule.timeSlot}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Date",
        accessorKey: "schedule.startAt",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700">
            {formatDate(row.original.schedule?.startAt)}
          </span>
        ),
      },
      {
        header: "Qty",
        accessorKey: "qty",
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-700">
            {getValue<number>() ?? 1}
          </span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {getValue<number>().toFixed(2)}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-700">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Link href="/customers" className="hover:text-slate-700">
              Customers
            </Link>
            <span>/</span>
            <span>History</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            {data?.customer?.name || "Customer history"}
          </h1>
        </div>

        {data?.customer && (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
            {data.customer.email && (
              <p className="text-slate-700">
                Email:{" "}
                <span className="font-medium">{data.customer.email}</span>
              </p>
            )}
            {data.customer.phone && (
              <p className="text-slate-700">
                Phone:{" "}
                <span className="font-medium">{data.customer.phone}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Loading history…</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Stats cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total bookings
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {stats?.totalBookings ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total spent
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {(stats?.totalSpent ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Top services
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-slate-700">
                {stats?.services?.slice(0, 3).map((s) => (
                  <div key={`${s.serviceId}-${s.serviceName}`}>
                    {s.serviceName || "Service"}{" "}
                    <span className="text-[11px] text-slate-400">
                      ×{s.count}
                    </span>
                  </div>
                ))}
                {!stats?.services?.length && (
                  <span className="text-[11px] text-slate-400">
                    No services yet.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Upcoming bookings
            </h2>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <DataTable columns={columns} data={upcoming} />
            </div>
          </div>

          {/* Previous */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Previous bookings
            </h2>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <DataTable columns={columns} data={previous} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
