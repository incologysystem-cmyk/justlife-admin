"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Th, Td } from "../../components/admin/Table";
// import { fetchCustomers } from "../../services/adminCustomers";
import { fetchCustomers } from "@/app/components/services/adminCustomers";
// import type { Customer } from "../../types/customer";
import type { Customer } from "@/types/customer";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchCustomers();
        if (!mounted) return;
        setCustomers(res.customers);
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
              const name = `${c.firstName} ${c.lastName}`.trim();
              return (
                <tr key={c._id}>
                  <Td>{name || "—"}</Td>
                  <Td>
                    <div className="text-xs">
                      <div>{c.email || "—"}</div>
                      <div>{c.phoneE164 || "—"}</div>
                    </div>
                  </Td>
                  <Td>{c.totalBookings}</Td>
                  <Td>{c.totalJobs}</Td>
                  <Td>{c.totalSpent.toFixed(2)}</Td>
                  <Td>{new Date(c.createdAt).toLocaleDateString()}</Td>
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
