"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Table, Th, Td } from "../../../components/admin/Table";
// import { fetchCustomerById } from "../../../services/adminCustomers";
import { fetchCustomerById } from "@/app/components/services/adminCustomers";
// import type { CustomerWithHistory } from "../../../types/customer";
import type { CustomerWithHistory } from "@/types/customer";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id;

  const [customer, setCustomer] = useState<CustomerWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await fetchCustomerById(customerId);
        if (!mounted) return;
        setCustomer(res.customer);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load customer");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading customer…</p>;
  }

  if (error || !customer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          {error || "Customer not found"}
        </p>
        <Link
          href="/admin/customers"
          className="text-xs text-blue-600 underline"
        >
          Back to customers
        </Link>
      </div>
    );
  }

  const name = `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{name}</h1>
          <p className="text-xs text-slate-500">
            Customer ID: {customer._id}
          </p>
        </div>
        <Link
          href="/admin/customers"
          className="text-xs text-blue-600 underline"
        >
          Back to customers
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Bookings</p>
          <p className="text-xl font-semibold">{customer.totalBookings}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Jobs</p>
          <p className="text-xl font-semibold">{customer.totalJobs}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Spent</p>
          <p className="text-xl font-semibold">
            {customer.totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Contact info */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Contact</h2>
        <div className="text-xs text-slate-600 space-y-1">
          <p>Email: {customer.email || "—"}</p>
          <p>Phone: {customer.phoneE164 || "—"}</p>
          <p>
            Joined: {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Bookings history */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Bookings</h2>
        {customer.bookings.length === 0 ? (
          <p className="text-xs text-slate-500">
            No bookings for this customer yet.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Scheduled</Th>
                <Th>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {customer.bookings.map((b) => (
                <tr key={b._id}>
                  <Td>{b.code}</Td>
                  <Td>{b.serviceName}</Td>
                  <Td className="capitalize">{b.status}</Td>
                  <Td>
                    {new Date(b.scheduledAt).toLocaleString()}
                  </Td>
                  <Td>{b.totalAmount.toFixed(2)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Jobs history */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Jobs / Orders</h2>
        {customer.jobs.length === 0 ? (
          <p className="text-xs text-slate-500">
            No jobs for this customer yet.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Job Code</Th>
                <Th>Category</Th>
                <Th>Provider</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {customer.jobs.map((j) => (
                <tr key={j._id}>
                  <Td>{j.jobCode}</Td>
                  <Td>{j.category}</Td>
                  <Td>{j.providerName || "—"}</Td>
                  <Td className="capitalize">{j.status}</Td>
                  <Td>
                    {new Date(j.createdAt).toLocaleString()}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
