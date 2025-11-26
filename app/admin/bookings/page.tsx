"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Table, Th, Td } from "../../components/admin/Table";
import { fetchBookings } from "@/app/components/services/adminBookings";
import type { Booking } from "@/types/booking";

const statusClass = (status: string | undefined) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "completed":
      return "bg-slate-900 text-slate-50 border-slate-800";
    case "cancelled":
    case "refunded":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchBookings(); // ⬅️ yahan se sari bookings aa rahi hain (backend list endpoint se)
        if (!mounted) return;
        setBookings(res.bookings || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalRevenue = useMemo(
    () =>
      bookings.reduce(
        (sum, b) => sum + (typeof b.totalAmount === "number" ? b.totalAmount : 0),
        0
      ),
    [bookings]
  );

  return (
    <div className="space-y-5">
      {/* Header + summary strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Bookings
          </h1>
          <p className="text-xs text-slate-500">
            All scheduled services across the platform.
          </p>
        </div>

        {!loading && !error && (
          <div className="flex gap-2 text-xs text-slate-500">
            <div className="rounded-full bg-slate-50 px-3 py-1">
              Total bookings:{" "}
              <span className="font-semibold text-slate-900">
                {bookings.length}
              </span>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1">
              Total revenue:{" "}
              <span className="font-semibold text-slate-900">
                {totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Loading bookings…
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm text-rose-700">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            No bookings found.
          </p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-0 shadow-sm">
          <Table>
            <thead>
              <tr>
                <Th>Booking</Th>
                <Th>Customer</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Scheduled</Th>
                <Th>Amount</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const scheduled =
                  b.scheduledAt &&
                  !Number.isNaN(new Date(b.scheduledAt).getTime())
                    ? new Date(b.scheduledAt).toLocaleString()
                    : "—";

                const shortService =
                  b.serviceName && b.serviceName.length > 32
                    ? b.serviceName.slice(0, 32) + "…"
                    : b.serviceName;

                return (
                  <tr key={b._id}>
                    {/* Booking code / id */}
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono text-slate-700">
                          {b.code || b._id}
                        </span>
                      </div>
                    </Td>

                    {/* Customer */}
                    <Td>
                      {b.customerId ? (
                        <Link
                          href={`/admin/customers/${b.customerId}`}
                          className="flex flex-col text-xs"
                        >
                          <span className="font-medium text-slate-900 hover:underline">
                            {b.customerName || "Customer"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {b.customerEmail || ""}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {b.customerName || "—"}
                        </span>
                      )}
                    </Td>

                    {/* Service */}
                    <Td>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-900">
                          {shortService || "—"}
                        </span>
                        {b.city && (
                          <span className="text-[11px] text-slate-500">
                            {b.city}
                          </span>
                        )}
                      </div>
                    </Td>

                    {/* Status pill */}
                    <Td>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusClass(
                          b.status
                        )}`}
                      >
                        {b.status || "—"}
                      </span>
                    </Td>

                    {/* Scheduled */}
                    <Td>
                      <span className="text-xs text-slate-700">
                        {scheduled}
                      </span>
                    </Td>

                    {/* Amount */}
                    <Td>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {b.totalAmount.toFixed(2)}
                      </span>
                    </Td>

                    {/* Actions */}
                    <Td>
                      <div className="flex gap-1">
                        <Link
                          href={`/admin/bookings/${b._id}`}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
