"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Th, Td } from "../../components/admin/Table";
// import { fetchJobs } from "../../services/adminJobs";
import { fetchJobs } from "@/app/components/services/adminJobs";
// import type { Job } from "../../types/job";
import type { Job } from "@/types/job";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchJobs();
        if (!mounted) return;
        setJobs(res.jobs);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load jobs");
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
          <h1 className="text-lg font-semibold">Jobs / Orders</h1>
          <p className="text-xs text-slate-500">
            All jobs assigned to providers across the platform.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Loading jobs…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p className="text-sm text-slate-500">No jobs found.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Job</Th>
              <Th>Customer</Th>
              <Th>Provider</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j._id}>
                <Td>{j.jobCode}</Td>
                <Td>
                  <Link
                    href={`/admin/customers/${j.customerId}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {j.customerName}
                  </Link>
                </Td>
                <Td>{j.providerName || "—"}</Td>
                <Td>{j.category}</Td>
                <Td className="capitalize">{j.status}</Td>
                <Td>{new Date(j.createdAt).toLocaleString()}</Td>
                <Td>{j.totalAmount.toFixed(2)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
