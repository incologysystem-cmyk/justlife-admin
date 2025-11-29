"use client";

import React, { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

type PayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled";

type PaymentRow = {
  id: string;
  type: "payout" | "charge";
  providerName?: string;
  providerId?: string;
  customerName?: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  createdAt?: string;
  paidAt?: string;
  method?: string; // e.g. "Bank Transfer", "Stripe", "Cash"
};

const STATUS_FILTERS: { label: string; value: "" | PayoutStatus }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
];

const columns: ColumnDef<PaymentRow>[] = [
  {
    header: "ID",
    accessorKey: "id",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id.slice(0, 8)}…
      </span>
    ),
  },
  {
    header: "Party",
    accessorKey: "providerName",
    cell: ({ row }) => {
      const { providerName, customerName, type } = row.original;
      if (type === "payout") {
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {providerName || "—"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Provider
            </span>
          </div>
        );
      }
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {customerName || "—"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Customer charge
          </span>
        </div>
      );
    },
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => {
      const { amount, currency } = row.original;
      return (
        <span className="text-sm font-semibold">
          {currency} {amount.toFixed(2)}
        </span>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.original.status;
      const base =
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-none";
      let cls = "bg-slate-100 text-slate-800";
      if (status === "pending") cls = "bg-amber-100 text-amber-800";
      if (status === "processing") cls = "bg-blue-100 text-blue-800";
      if (status === "paid") cls = "bg-emerald-100 text-emerald-800";
      if (status === "failed") cls = "bg-rose-100 text-rose-800";
      if (status === "cancelled") cls = "bg-slate-200 text-slate-700";

      return (
        <Badge className={`${base} ${cls} capitalize`}>
          {status}
        </Badge>
      );
    },
  },
  {
    header: "Method",
    accessorKey: "method",
    cell: ({ row }) => row.original.method || "—",
  },
  {
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const d = row.original.createdAt;
      if (!d) return "—";
      return new Date(d).toLocaleString();
    },
  },
  {
    header: "Paid At",
    accessorKey: "paidAt",
    cell: ({ row }) => {
      const d = row.original.paidAt;
      if (!d) return "—";
      return new Date(d).toLocaleString();
    },
  },
];

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<"" | PayoutStatus>("");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async (status: "" | PayoutStatus) => {
    try {
      setLoading(true);
      setError(null);

      const query = status ? `?status=${status}` : "";
      // yahan bhi tum baad me /api/admin/payments proxy banaoge
      const res = await fetch(`/api/admin/payments${query}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to load payments");
      }

      const data = await res.json();
      const items = (data.payments || []) as any[];

      const mapped: PaymentRow[] = items.map((p) => ({
        id: String(p._id || p.id),
        type: (p.type || "payout") as PaymentRow["type"],
        providerName: p.providerName,
        providerId: p.providerId,
        customerName: p.customerName,
        amount: Number(p.amount || 0),
        currency: p.currency || "AED",
        status: p.status as PayoutStatus,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        method: p.method,
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error("Error loading payments:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Payments & Payouts
          </h1>
          <p className="text-sm text-muted-foreground">
            Track customer charges and provider payouts, and monitor their
            status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="inline-flex rounded-lg border bg-muted p-1 text-xs sm:text-sm">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={[
                  "px-3 py-1 rounded-md transition",
                  statusFilter === opt.value
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Manual refresh button */}
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => loadPayments(statusFilter)}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error / Loading / Table */}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading payments…
        </div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
}
