// app/admin/customers/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Th, Td } from "../../components/admin/Table";
import {
  fetchCustomers,
  fetchCustomerById,
} from "@/app/components/services/adminCustomers";
import type { Customer } from "@/types/customer";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) basic list (sirf users)
        const res = await fetchCustomers();
        if (!mounted) return;

        const baseCustomers = res.customers || [];

        // 2) har customer ka detailed history le kar stats merge karo
        const enriched = await Promise.all(
          baseCustomers.map(async (c) => {
            try {
              const detail = await fetchCustomerById(c._id);
              const dc = detail.customer;

              const totalBookings =
                (dc as any).totalBookings ??
                (dc as any).stats?.totalBookings ??
                c.totalBookings ??
                0;

              const totalSpent =
                (dc as any).totalSpent ??
                (dc as any).stats?.totalSpent ??
                c.totalSpent ??
                0;

              const totalJobs =
                (dc as any).totalJobs ??
                ((dc as any).stats?.services || []).reduce(
                  (sum: number, s: any) => sum + (s.count ?? 0),
                  0
                ) ??
                c.totalJobs ??
                0;

              return {
                ...c,
                totalBookings,
                totalSpent,
                totalJobs,
              } as Customer;
            } catch {
              // agar detail fail ho jaye to basic wali values use kar lo
              return c;
            }
          })
        );

        if (!mounted) return;
        setCustomers(enriched);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Customers</h1>
          <p className="text-xs text-slate-500">
            View all customers and their booking history.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Loading customers…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && customers.length === 0 && (
        <p className="text-sm text-slate-500">No customers found.</p>
      )}

      {!loading && !error && customers.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Contact</Th>
              <Th>Bookings</Th>
              <Th>Jobs</Th>
              <Th>Total Spent</Th>
              <Th>Joined</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const name = `${c.firstName ?? ""} ${
                c.lastName ?? ""
              }`.trim();

              const joined =
                c.createdAt &&
                !Number.isNaN(new Date(c.createdAt).getTime())
                  ? new Date(c.createdAt).toLocaleDateString()
                  : "—";

              const totalBookings =
                typeof c.totalBookings === "number"
                  ? c.totalBookings
                  : 0;

              const totalJobs =
                typeof c.totalJobs === "number" ? c.totalJobs : 0;

              const totalSpentNumber =
                typeof c.totalSpent === "number" ? c.totalSpent : 0;

              return (
                <tr key={c._id}>
                  <Td>{name || "—"}</Td>
                  <Td>
                    <div className="text-xs">
                      <div>{c.email || "—"}</div>
                      <div>{c.phoneE164 || "—"}</div>
                    </div>
                  </Td>
                  <Td>{totalBookings}</Td>
                  <Td>{totalJobs}</Td>
                  <Td>{totalSpentNumber.toFixed(2)}</Td>
                  <Td>{joined}</Td>
                  <Td>
                    <Link
                      href={`/admin/customers/${c._id}`}
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
    </div>
  );
}
