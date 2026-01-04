"use client"; 

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

// ✅ shadcn dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type TxStatus = "paid" | "pending" | "failed" | "cancelled" | "refunded" | string;

type ProviderTransactionRow = {
  id: string;
  createdAt?: string;

  status: TxStatus;
  currency: string;
  amount: number;

  serviceName?: string;
  customerName?: string;
  customerEmail?: string;
  phone?: string;

  providerId?: string;

  stripe?: {
    sessionId?: string;
    paymentIntentId?: string;
  };
};

type TransactionsApiResponse = {
  page: number;
  limit: number;
  total: number;
  items: ProviderTransactionRow[];
};

// single transaction response (same shape as row)
type TransactionDetail = ProviderTransactionRow;

const STATUS_FILTERS: { label: string; value: "" | TxStatus }[] = [
  { label: "All", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

function money(amount: number, currency: string) {
  const n = Number(amount || 0);
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function StatusPill({ status }: { status: string }) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-none capitalize";
  let cls = "bg-slate-100 text-slate-800";
  if (status === "pending") cls = "bg-amber-100 text-amber-800";
  if (status === "processing") cls = "bg-blue-100 text-blue-800";
  if (status === "paid") cls = "bg-emerald-100 text-emerald-800";
  if (status === "failed") cls = "bg-rose-100 text-rose-800";
  if (status === "cancelled") cls = "bg-slate-200 text-slate-700";
  if (status === "refunded") cls = "bg-purple-100 text-purple-800";

  return <Badge className={`${base} ${cls}`}>{status}</Badge>;
}

export default function ProviderFinancePage() {
  const [statusFilter, setStatusFilter] = useState<"" | TxStatus>("");
  const [rows, setRows] = useState<ProviderTransactionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // ✅ dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadTransactions = useCallback(
    async (opts?: { status?: "" | TxStatus; page?: number }) => {
      const st = opts?.status ?? statusFilter;
      const pg = opts?.page ?? page;

      try {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams();
        qs.set("page", String(pg));
        qs.set("limit", String(limit));
        if (st) qs.set("status", String(st));

        const res = await fetch(`/api/provider/transactions?${qs.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });

        const body = (await res.json().catch(() => ({}))) as Partial<TransactionsApiResponse> & {
          message?: string;
          error?: string;
        };

        if (!res.ok) throw new Error(body?.message || body?.error || "Failed to load transactions");

        const items = Array.isArray(body.items) ? body.items : [];
        setRows(items);
        setTotal(Number(body.total || 0));
      } catch (err: any) {
        console.error("Error loading provider transactions:", err);
        setError(err?.message || "Something went wrong");
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter]
  );

  // ✅ fetch single transaction (proxy)
  const loadTransactionById = useCallback(async (id: string) => {
    try {
      setSelectedId(id);
      setDetailOpen(true);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);

      const res = await fetch(`/api/provider/transactions/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const body = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) throw new Error(body?.message || body?.error || "Failed to load transaction");

      setDetail(body as TransactionDetail);
    } catch (e: any) {
      console.error("Error loading transaction:", e);
      setDetailError(e?.message || "Something went wrong");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // reload on status/page
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // ✅ columns moved inside to use loadTransactionById
  const columns = useMemo<ColumnDef<ProviderTransactionRow>[]>(
    () => [
      {
        header: "Txn ID",
        accessorKey: "id",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.id.slice(0, 8)}…
          </span>
        ),
      },
      {
        header: "Service",
        accessorKey: "serviceName",
        cell: ({ row }) => row.original.serviceName || "—",
      },
      {
        header: "Customer",
        accessorKey: "customerName",
        cell: ({ row }) => {
          const n = row.original.customerName || "—";
          const e = row.original.customerEmail;
          return (
            <div className="min-w-0">
              <div className="text-sm truncate">{n}</div>
              {e ? <div className="text-xs opacity-60 truncate">{e}</div> : null}
            </div>
          );
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {money(row.original.amount, row.original.currency || "AED")}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusPill status={String(row.original.status || "")} />,
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
        header: "Stripe",
        id: "stripe",
        cell: ({ row }) => {
          const s = row.original.stripe?.sessionId;
          const pi = row.original.stripe?.paymentIntentId;
          if (!s && !pi) return "—";

          return (
            <div className="text-xs">
              {s ? (
                <div className="font-mono opacity-80 truncate">sess: {s.slice(0, 12)}…</div>
              ) : null}
              {pi ? (
                <div className="font-mono opacity-60 truncate">pi: {pi.slice(0, 12)}…</div>
              ) : null}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => loadTransactionById(row.original.id)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </Button>
        ),
      },
    ],
    [loadTransactionById]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Paid bookings transactions list (amount, customer, service, stripe ids).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="inline-flex rounded-lg border bg-muted p-1 text-xs sm:text-sm">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatusFilter(opt.value);
                }}
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

          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => loadTransactions({ page })}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading transactions…
        </div>
      ) : (
        <div className="space-y-3">
          <DataTable columns={columns} data={rows} showActionColumn={false} />


          {/* Simple pager */}
          <div className="flex items-center justify-between text-xs opacity-70">
            <div>
              Page {page} / {totalPages} · Total {total}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded border hover:bg-card disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded border hover:bg-card disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Details Popup */}
      <Dialog
        open={detailOpen}
        onOpenChange={(v) => {
          setDetailOpen(v);
          if (!v) {
            setSelectedId(null);
            setDetail(null);
            setDetailError(null);
            setDetailLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {selectedId ? selectedId : ""}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading transaction…
            </div>
          ) : detailError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {detailError}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1">
                    <StatusPill status={String(detail.status || "")} />
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="mt-1 font-semibold">
                    {money(detail.amount, detail.currency || "AED")}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Service</div>
                  <div className="mt-1">{detail.serviceName || "—"}</div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="mt-1">
                    {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="mt-1">{detail.customerName || "—"}</div>
                  {detail.customerEmail ? (
                    <div className="text-xs opacity-70">{detail.customerEmail}</div>
                  ) : null}
                  {detail.phone ? <div className="text-xs opacity-70">{detail.phone}</div> : null}
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Stripe</div>
                  <div className="mt-1 space-y-1 text-xs font-mono">
                    <div>session: {detail.stripe?.sessionId || "—"}</div>
                    <div>intent: {detail.stripe?.paymentIntentId || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No details.</div>
          )}

          <DialogFooter>
            {selectedId ? (
              <Button
                variant="outline"
                onClick={() => loadTransactionById(selectedId)}
                disabled={detailLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
            ) : null}
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}