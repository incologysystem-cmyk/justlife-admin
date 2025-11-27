// app/provider/customers/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "@/app/components/tables/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchProviderCustomers, type ProviderCustomerSummary } from "@/app/services/providerCustomers";

export default function ProviderCustomersPage() {
  const [rows, setRows] = useState<ProviderCustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchProviderCustomers();
        if (!mounted) return;
        setRows(items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load customers");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const columns: ColumnDef<ProviderCustomerSummary>[] = [
    {
      header: "Customer",
      accessorKey: "customerName",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-900">
              {r.customerName || "Unnamed"}
            </span>
            {r.customerEmail && (
              <span className="text-[11px] text-slate-500">
                {r.customerEmail}
              </span>
            )}
            {r.phone && (
              <span className="text-[11px] text-slate-500">
                {r.phone}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Total Bookings",
      accessorKey: "totalBookings",
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-slate-900">
          {getValue<number>()}
        </span>
      ),
    },
    {
      header: "Total Spent",
      accessorKey: "totalSpent",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {getValue<number>().toFixed(2)}
        </span>
      ),
    },
    {
      header: "Top Services",
      accessorKey: "services",
      cell: ({ row }) => {
        const services = row.original.services || [];
        if (!services.length) {
          return (
            <span className="text-[11px] text-slate-400">—</span>
          );
        }
        const top = services.slice(0, 2);
        return (
          <div className="flex flex-col gap-0.5">
            {top.map((s) => (
              <span
                key={`${s.serviceId}-${s.serviceName}`}
                className="text-[11px] text-slate-600"
              >
                {s.serviceName || "Service"}{" "}
                <span className="text-slate-400">×{s.count}</span>
              </span>
            ))}
            {services.length > 2 && (
              <span className="text-[10px] text-slate-400">
                +{services.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex gap-1">
            <Link
              href={`/customers/${encodeURIComponent(
                r.customerId
              )}`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              View history
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            My Customers
          </h1>
          <p className="text-xs text-slate-500">
            Customers who have booked your services.
          </p>
        </div>

        {!loading && !error && (
          <div className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600">
            Total customers:{" "}
            <span className="font-semibold text-slate-900">
              {rows.length}
            </span>
          </div>
        )}
      </div>

      {/* Error / Loading / Table */}
      {loading && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Loading customers…
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
          <DataTable columns={columns} data={rows} />
        </div>
      )}
    </div>
  );
}
