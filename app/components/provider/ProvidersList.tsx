"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "../tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
// import { fetchAllProviders } from "@/app/services/adminProviders";
import { fetchAllProviders } from "@/app/services/adminProvidersList";

type ProviderStatus = "pending" | "approved" | "rejected";

type ProviderRow = {
  id: string;
  nameOfSupplier?: string;
  legalName?: string;
  status: ProviderStatus;
  email?: string;
  phone?: string;
  createdAt?: string;
};

const STATUS_OPTIONS: { label: string; value: "" | ProviderStatus }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const columns: ColumnDef<ProviderRow>[] = [
  {
    header: "Supplier",
    accessorKey: "nameOfSupplier",
    cell: ({ row }) => {
      const value = row.original.nameOfSupplier || "—";
      return <span className="font-medium">{value}</span>;
    },
  },
  {
    header: "Legal Name",
    accessorKey: "legalName",
    cell: ({ row }) => row.original.legalName || "—",
  },
  {
    header: "Contact",
    accessorKey: "email",
    cell: ({ row }) => {
      const { email, phone } = row.original;
      if (!email && !phone) return "—";
      return (
        <div className="flex flex-col gap-0.5">
          {email && <span className="text-sm">{email}</span>}
          {phone && (
            <span className="text-xs text-muted-foreground">{phone}</span>
          )}
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variantClass = "bg-slate-100 text-slate-800";
      if (status === "pending") variantClass = "bg-amber-100 text-amber-800";
      if (status === "approved")
        variantClass = "bg-emerald-100 text-emerald-800";
      if (status === "rejected") variantClass = "bg-rose-100 text-rose-800";

      return (
        <Badge className={variantClass + " capitalize border-none"}>
          {status}
        </Badge>
      );
    },
  },
  {
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return "—";
      const date = new Date(createdAt);
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/providers/${id}`}>View</Link>
          </Button>
        </div>
      );
    },
  },
];

export default function ProvidersList() {
  const [status, setStatus] = useState<"" | ProviderStatus>("");
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async (statusFilter: "" | ProviderStatus) => {
    try {
      setLoading(true);
      setError(null);

      const { providers } = await fetchAllProviders(statusFilter || "");

      const mapped: ProviderRow[] = (providers || []).map((p: any) => ({
        id: String(p._id),
        nameOfSupplier: p.nameOfSupplier,
        legalName: p.legalName,
        status: p.status as ProviderStatus,
        email: p.userId?.email,
        phone: p.userId?.phoneE164,
        createdAt: p.createdAt,
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error("Error loading providers:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders(status);
  }, [status]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Providers
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage all supplier/provider profiles.
          </p>
        </div>

        {/* Status filter buttons */}
        <div className="inline-flex rounded-lg border bg-muted p-1 text-xs sm:text-sm">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={[
                "px-3 py-1 rounded-md transition",
                status === opt.value
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error / Loading states */}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading providers…
        </div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
}
