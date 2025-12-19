"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "./DataTable";
import { StatusBadge } from "../common/StatusBadge";
import { fetchProviderBookings } from "@/app/services/providerBookings";
import type { Booking as ApiBooking } from "@/types/booking";

// Row type specifically for this table
export type BookingRow = {
  id: string;
  createdAt: string;
  customerName: string;
  serviceName: string;
  totalAmount: number;
  status: string;
};

export default function BookingsTable({
  initialLimit = 20,
}: {
  initialLimit?: number;
}) {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetchProviderBookings(); // 🔹 real bookings from /api/admin/bookings
        if (!mounted) return;

        const slice = (res.bookings || []).slice(0, initialLimit);

        const mapped: BookingRow[] = slice.map((b: ApiBooking) => ({
          id: b.code || (b as any)._id || "",
          createdAt: b.scheduledAt || (b as any).createdAt || new Date().toISOString(),
          customerName: (b as any).customerName || "—",
          serviceName: b.serviceName || "—",
          totalAmount:
            typeof b.totalAmount === "number" ? b.totalAmount : 0,
          status: (b as any).status || "paid",
        }));

        setRows(mapped);
      } catch (err) {
        console.error("Failed to load bookings for BookingsTable:", err);
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialLimit]);

  const columns: ColumnDef<BookingRow>[] = [
    {
      header: "Booking #",
      accessorKey: "id",
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-slate-700">
          {getValue<string>()}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const d = new Date(v);
        return (
          <span className="text-xs">
            {Number.isNaN(d.getTime()) ? "—" : d.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: "Customer",
      accessorKey: "customerName",
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-900">
          {getValue<string>() || "—"}
        </span>
      ),
    },
    {
      header: "Service",
      accessorKey: "serviceName",
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-900">
          {getValue<string>() || "—"}
        </span>
      ),
    },
    {
      header: "Total",
      accessorKey: "totalAmount",
      cell: ({ getValue }) => {
        const val = getValue<number>() ?? 0;
        return (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {val.toFixed(2)}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>() as any} />
      ),
    },
  ];

  // Agar tum loading state dikhana chaho:
  if (loading && rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-500">
        Loading bookings…
      </div>
    );
  }

  return <DataTable columns={columns} data={rows} />;
}
