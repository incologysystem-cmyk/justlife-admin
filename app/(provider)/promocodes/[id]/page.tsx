// src/app/provider/promocodes/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchProviderPromocodeById,
  deleteProviderPromocode,
  type ProviderPromocode,
  type PromoStatus,
} from "@/app/services/providerPromocodes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trash2, Pencil } from "lucide-react";
import { CreatePromocodeModal } from "@/app/components/provider/promocodes/CreatePromocodeModal";

export default function ProviderPromocodeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const idRaw = params?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  const [promo, setPromo] = useState<ProviderPromocode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  const loadPromocode = useCallback(async () => {
    if (!id) {
      setError("Invalid promocode id");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { promocode } = await fetchProviderPromocodeById(id);
      setPromo(promocode);
    } catch (err: any) {
      console.error("Failed to load promocode:", err);
      setError(err?.message || "Failed to load promocode");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPromocode();
  }, [loadPromocode]);

  const goBack = () => {
    router.push("/promocodes");
  };

  const handleDelete = async () => {
    if (!promo) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteProviderPromocode(promo._id);
      router.push("/provider/promocodes");
    } catch (err: any) {
      console.error("Delete promocode error:", err);
      setDeleteError(err?.message || "Failed to delete promocode");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = () => {
    setEditOpen(true);
  };

  const fmtDateTime = (value?: string) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading promocode…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            className="inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            className="inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          Promocode not found.
        </p>
      </div>
    );
  }

  const isPercentage = promo.discountType === "percentage";
  const discountLabel = isPercentage
    ? `${promo.amount}% off`
    : promo.currency
    ? `${promo.currency} ${promo.amount}`
    : promo.amount;

  const usageLabel = promo.maxUsage
    ? `${promo.usedCount ?? 0} / ${promo.maxUsage}`
    : `${promo.usedCount ?? 0} used`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top header / breadcrumb bar */}
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Promocode details
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="text-muted-foreground">Code:</span>{" "}
              <span className="rounded-md bg-muted/80 px-2 py-1 font-mono text-base">
                {promo.code}
              </span>
            </h1>
            <StatusBadge status={promo.status} />
          </div>

          {promo.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {promo.description}
            </p>
          )}
        </div>

        {/* Actions + summary chips */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              Discount: <span className="font-semibold">{discountLabel}</span>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-slate-700">
              Usage: <span className="font-semibold">{usageLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleUpdate}
              className="inline-flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              Update
            </Button>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              className="inline-flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Summary row cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Type
          </p>
          <p className="mt-1 text-sm font-semibold capitalize">
            {promo.discountType}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Starts at
          </p>
          <p className="mt-1 text-sm font-medium">
            {fmtDateTime(promo.startsAt)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Ends at
          </p>
          <p className="mt-1 text-sm font-medium">
            {fmtDateTime(promo.endsAt)}
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Discount & usage card */}
        <section className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Discount & Usage</h2>

          <dl className="mt-1 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="font-semibold text-right">{discountLabel}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Discount type</dt>
              <dd className="font-medium capitalize">{promo.discountType}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Usage</dt>
              <dd className="font-medium">{usageLabel}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={promo.status} />
              </dd>
            </div>
          </dl>
        </section>

        {/* Validity & meta card */}
        <section className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Validity & Timeline</h2>

          <dl className="mt-1 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Starts at</dt>
              <dd className="font-medium text-right">
                {fmtDateTime(promo.startsAt)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Ends at</dt>
              <dd className="font-medium text-right">
                {fmtDateTime(promo.endsAt)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Created at</dt>
              <dd className="font-medium text-right">
                {fmtDateTime(promo.createdAt)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium text-right">
                {fmtDateTime(promo.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Service & internal IDs */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold">Linked Entities</h2>

        <dl className="mt-1 space-y-3 text-sm">
          <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-2 md:flex-row md:items-center md:justify-between">
            <dt className="text-muted-foreground">Service ID</dt>
            <dd className="font-mono text-xs font-medium break-all text-slate-800">
              {promo.serviceId || "—"}
            </dd>
          </div>

          <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-2 md:flex-row md:items-center md:justify-between">
            <dt className="text-muted-foreground">Provider ID</dt>
            <dd className="font-mono text-xs font-medium break-all text-slate-800">
              {promo.providerId || "—"}
            </dd>
          </div>

          <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-2 md:flex-row md:items-center md:justify-between">
            <dt className="text-muted-foreground">Created by (user)</dt>
            <dd className="font-mono text-xs font-medium break-all text-slate-800">
              {promo.createdBy || "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Delete confirmation overlay */}
      {deleteOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-base font-semibold text-slate-900">
              Delete this promocode?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete{" "}
              <span className="font-mono font-semibold">{promo.code}</span>.{" "}
              Bookings that already used this code will stay unchanged, but it
              can’t be applied again.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-semibold">Promocode ID:</span>{" "}
              {promo._id}
            </div>

            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1"
              >
                {deleting && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {deleting ? "Deleting…" : "Yes, delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {promo && (
        <CreatePromocodeModal
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          initial={{
            id: promo._id,
            code: promo.code,
            description: promo.description,
            serviceId: promo.serviceId,
            discountType: promo.discountType,
            amount: promo.amount,
            currency: promo.currency,
            maxUsage: promo.maxUsage,
            startsAt: promo.startsAt,
            endsAt: promo.endsAt,
          }}
          onUpdated={async () => {
            await loadPromocode();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PromoStatus }) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-none";

  if (status === "active") {
    return (
      <Badge className={`${base} bg-emerald-100 text-emerald-800`}>
        Active
      </Badge>
    );
  }
  if (status === "scheduled") {
    return (
      <Badge className={`${base} bg-blue-100 text-blue-800`}>Scheduled</Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge className={`${base} bg-amber-100 text-amber-800`}>Expired</Badge>
    );
  }
  if (status === "disabled") {
    return (
      <Badge className={`${base} bg-rose-100 text-rose-800`}>Disabled</Badge>
    );
  }
  return (
    <Badge className={`${base} bg-slate-100 text-slate-800`}>{status}</Badge>
  );
}
