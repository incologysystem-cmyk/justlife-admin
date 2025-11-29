"use client";

import React, { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

type PromoStatus = "active" | "scheduled" | "expired" | "disabled";
type DiscountType = "percentage" | "fixed";

type PromocodeRow = {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  amount: number;
  currency?: string;
  maxUsage?: number;
  usedCount?: number;
  startsAt?: string;
  endsAt?: string;
  status: PromoStatus;
};

const STATUS_FILTERS: { label: string; value: "" | PromoStatus }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Expired", value: "expired" },
  { label: "Disabled", value: "disabled" },
];

const columns: ColumnDef<PromocodeRow>[] = [
  {
    header: "Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold">
        {row.original.code}
      </span>
    ),
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => row.original.description || "—",
  },
  {
    header: "Discount",
    accessorKey: "amount",
    cell: ({ row }) => {
      const { discountType, amount, currency } = row.original;
      if (discountType === "percentage") {
        return `${amount}% off`;
      }
      return currency ? `${currency} ${amount}` : `${amount}`;
    },
  },
  {
    header: "Usage",
    accessorKey: "usedCount",
    cell: ({ row }) => {
      const { usedCount = 0, maxUsage } = row.original;
      if (maxUsage) return `${usedCount} / ${maxUsage}`;
      return `${usedCount} used`;
    },
  },
  {
    header: "Validity",
    accessorKey: "startsAt",
    cell: ({ row }) => {
      const { startsAt, endsAt } = row.original;
      const fmt = (d?: string) =>
        d ? new Date(d).toLocaleDateString() : "—";
      if (!startsAt && !endsAt) return "—";
      return `${fmt(startsAt)} → ${fmt(endsAt)}`;
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
      if (status === "active") cls = "bg-emerald-100 text-emerald-800";
      if (status === "scheduled") cls = "bg-blue-100 text-blue-800";
      if (status === "expired") cls = "bg-amber-100 text-amber-800";
      if (status === "disabled") cls = "bg-rose-100 text-rose-800";

      return (
        <Badge className={`${base} ${cls} capitalize`}>
          {status}
        </Badge>
      );
    },
  },
];

export default function PromocodesPage() {
  const [statusFilter, setStatusFilter] = useState<"" | PromoStatus>("");
  const [rows, setRows] = useState<PromocodeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPromocodes = async (status: "" | PromoStatus) => {
    try {
      setLoading(true);
      setError(null);

      const query = status ? `?status=${status}` : "";
      // yahan tum baad me apna Next proxy laga sakte ho
      const res = await fetch(`/api/admin/promocodes${query}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to load promocodes");
      }

      const data = await res.json();
      const items = (data.promocodes || []) as any[];

      const mapped: PromocodeRow[] = items.map((p) => ({
        id: String(p._id),
        code: p.code,
        description: p.description,
        discountType: p.discountType as DiscountType,
        amount: p.amount,
        currency: p.currency,
        maxUsage: p.maxUsage,
        usedCount: p.usedCount,
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        status: p.status as PromoStatus,
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error("Error loading promocodes:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromocodes(statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Promocodes & Discounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage discount codes for campaigns and partners.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
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

          {/* Create button (abhi sirf dummy, baad me form ya drawer open kar sakte ho) */}
          <Button className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Promocode
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
          Loading promocodes…
        </div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
}
