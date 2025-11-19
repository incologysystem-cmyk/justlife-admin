"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Th, Td } from "../../components/admin/Table";
// import { fetchBookings } from "../../services/adminBookings";
import { fetchBookings } from "@/app/components/services/adminBookings";
// import type { Booking } from "../../types/booking";
import type { Booking } from "@/types/booking";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchBookings();
        if (!mounted) return;
        setBookings(res.bookings);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Bookings</h1>
          <p className="text-xs text-slate-500">
            All scheduled services across the platform.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Loading bookings…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-slate-500">No bookings found.</p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Booking</Th>
              <Th>Customer</Th>
              <Th>Service</Th>
              <Th>Status</Th>
              <Th>Scheduled</Th>
              <Th>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <Td>{b.code}</Td>
                <Td>
                  <Link
                    href={`/admin/customers/${b.customerId}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {b.customerName}
                  </Link>
                </Td>
                <Td>{b.serviceName}</Td>
                <Td className="capitalize">{b.status}</Td>
                <Td>{new Date(b.scheduledAt).toLocaleString()}</Td>
                <Td>{b.totalAmount.toFixed(2)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
