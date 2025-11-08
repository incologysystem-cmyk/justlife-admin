"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "@/app/components/bookings/Calendar";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClipboardList,
  Copy,
  Dot,
  ListChecks,
  ToggleRight,
} from "lucide-react";

const isHex24 = (s: string) => /^[0-9a-fA-F]{24}$/.test(s);

type Booking = {
  _id: string;
  serviceName?: string;
  status?: "pending" | "paid" | "failed" | "cancelled" | "refunded" | string;
  qty?: number;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  address?: { line1?: string; city?: string; country?: string };
  price?: {
    currency?: string;
    base?: number;
    addons?: number;
    discount?: number;
    fees?: number;
    total?: number;
    promoCode?: string;
  };
  schedule?: { startAt?: string; tz?: string; timeSlot?: string; frequency?: string };
  addonItems?: Array<{ name: string; qty: number; unitPrice?: number }>;
  formAnswers?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

function statusTone(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "failed":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "cancelled":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "refunded":
      return "bg-sky-100 text-sky-800 border-sky-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

function KeyRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <>
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="col-span-2 text-sm break-words">{value ?? "-"}</div>
    </>
  );
}

/* -------------------- Fancy Form Answers -------------------- */

function prettyKey(k: string) {
  return k
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function ValueBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium">
      <Dot className="h-4 w-4 text-neutral-400 -ml-1 mr-1" />
      {children}
    </span>
  );
}

function BoolBadge({ val }: { val: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        val
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      <ToggleRight className="h-3.5 w-3.5 mr-1.5" />
      {val ? "True" : "False"}
    </span>
  );
}

function renderValue(val: any, depth = 0): React.ReactNode {
  if (val === null || val === undefined) return <span className="text-neutral-500">—</span>;
  if (typeof val === "boolean") return <BoolBadge val={val} />;
  if (typeof val === "number") return <ValueBadge>{val}</ValueBadge>;
  if (typeof val === "string") return <ValueBadge>{val}</ValueBadge>;

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-neutral-500">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {val.map((item, i) => (
          <ValueBadge key={i}>{String(item)}</ValueBadge>
        ))}
      </div>
    );
  }

  // object
  if (depth >= 2) {
    // collapse deep objects
    return (
      <pre className="whitespace-pre-wrap break-words bg-neutral-50 p-2 rounded-lg border text-xs">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }

  const entries = Object.entries(val);
  if (entries.length === 0) return <span className="text-neutral-500">—</span>;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white to-neutral-50 p-3">
      <div className="grid grid-cols-3 gap-2">
        {entries.map(([k, v]) => (
          <div key={k} className="col-span-3 sm:col-span-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">{prettyKey(k)}</div>
            <div className="text-sm">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormAnswersPretty({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-neutral-600" />
        <div className="font-medium">Form Answers</div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="col-span-6 sm:col-span-3 lg:col-span-3 rounded-xl border bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
              {prettyKey(k)}
            </div>
            <div className="text-sm">{renderValue(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonBlock({ obj }: { obj: unknown }) {
  return (
    <pre className="whitespace-pre-wrap break-words bg-neutral-50 p-3 rounded-lg border text-xs">
      {JSON.stringify(obj, null, 2)}
    </pre>
  );
}

/* -------------------- Component -------------------- */

export default function BookingsClient({ items }: { items: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const open = !!selectedId;

  const subtitle = useMemo(() => {
    if (!booking?.schedule?.startAt) return null;
    const d = new Date(booking.schedule.startAt);
    return `${format(d, "EEE, MMM d, yyyy • HH:mm")} ${
      booking.schedule?.tz ? `(${booking.schedule.tz})` : ""
    }`;
  }, [booking]);

  useEffect(() => {
    const raw = (selectedId || "").trim();
    if (!raw) return;

    if (!isHex24(raw)) {
      setError("Invalid booking id");
      setBooking(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setShowRaw(false);
        setBooking(null);

        const url = `/api/admin/bookings/${encodeURIComponent(raw)}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `Failed to load booking ${raw}`);

        const b = (json?.data?.booking ?? json?.booking ?? json) as Booking;
        if (!cancelled) setBooking(b || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load booking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const close = () => {
    setSelectedId(null);
    setBooking(null);
    setError(null);
    setCopied(false);
    setShowRaw(false);
  };

  const copyId = async () => {
    if (!booking?._id) return;
    await navigator.clipboard.writeText(booking._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <>
      <Calendar items={items} onSelect={setSelectedId} />

      <Dialog open={open} onOpenChange={(val) => (!val ? close() : null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-base sm:text-lg">
                  {booking?.serviceName ?? "Booking details"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {subtitle || "—"}
                </DialogDescription>
              </div>
              {booking?.status && (
                <Badge
                  variant="outline"
                  className={`border ${statusTone(booking.status)} capitalize`}
                  title={booking.status}
                >
                  {booking.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Separator />

          {/* Body with subtle top/bottom fades */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white/90 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent z-10" />

            <div className="px-6 py-4">
              {loading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-56" />
                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 col-span-2" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 col-span-2" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 col-span-2" />
                  </div>
                </div>
              )}

              {!loading && error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!loading && !error && booking && (
                <div
                  className="max-h-[58vh] pr-3 overflow-y-auto custom-scroll"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div className="grid grid-cols-3 gap-3">
                    <KeyRow
                      label="Booking ID"
                      value={
                        <div className="flex items-center gap-2">
                          <span className="break-all">{booking._id}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={copyId}
                            title="Copy ID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {copied && (
                            <span className="text-xs text-emerald-600">Copied</span>
                          )}
                        </div>
                      }
                    />

                    <KeyRow label="Service" value={booking.serviceName || "-"} />
                    <KeyRow
                      label="Status"
                      value={
                        <Badge className={`border ${statusTone(booking.status)}`}>
                          {booking.status ?? "-"}
                        </Badge>
                      }
                    />
                    <KeyRow label="Qty" value={booking.qty ?? "-"} />

                    <KeyRow
                      label="Customer"
                      value={
                        <>
                          {booking.customerName || "-"}
                          {booking.customerEmail ? (
                            <span className="text-neutral-500">
                              {" "}
                              · {booking.customerEmail}
                            </span>
                          ) : null}
                          {booking.phone ? (
                            <span className="text-neutral-500"> · {booking.phone}</span>
                          ) : null}
                        </>
                      }
                    />

                    <KeyRow
                      label="Address"
                      value={
                        booking.address
                          ? [booking.address.line1, booking.address.city, booking.address.country]
                              .filter(Boolean)
                              .join(", ")
                          : "-"
                      }
                    />

                    <KeyRow
                      label="Schedule"
                      value={
                        booking.schedule?.startAt ? (
                          <>
                            {format(
                              new Date(booking.schedule.startAt),
                              "EEE, MMM d, yyyy • HH:mm"
                            )}
                            {booking.schedule?.tz ? ` (${booking.schedule.tz})` : ""}
                            {booking.schedule?.timeSlot
                              ? ` · ${booking.schedule.timeSlot}`
                              : ""}
                            {booking.schedule?.frequency &&
                            booking.schedule.frequency !== "once"
                              ? ` · ${booking.schedule.frequency}`
                              : ""}
                          </>
                        ) : (
                          "-"
                        )
                      }
                    />

                    <KeyRow
                      label="Price"
                      value={
                        booking.price ? (
                          <>
                            {booking.price.total} {booking.price.currency}
                            <span className="text-neutral-500">
                              {" "}
                              (base {booking.price.base}
                              {booking.price.addons ? ` + addons ${booking.price.addons}` : ""}
                              {booking.price.discount ? ` - disc ${booking.price.discount}` : ""}
                              {booking.price.fees ? ` + fees ${booking.price.fees}` : ""})
                              {booking.price.promoCode ? ` · code ${booking.price.promoCode}` : ""}
                            </span>
                          </>
                        ) : (
                          "-"
                        )
                      }
                    />
                  </div>

                  {!!booking.addonItems?.length && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <div className="font-medium mb-2">Add-ons</div>
                        <ul className="space-y-1 text-sm">
                          {booking.addonItems.map((a, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <span className="truncate">{a.name}</span>
                              <span className="text-neutral-600">
                                ×{a.qty} {a.unitPrice != null ? `· ${a.unitPrice}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {!!booking.formAnswers && Object.keys(booking.formAnswers).length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-neutral-600" />
                          <div className="font-medium">Form Answers</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRaw((s) => !s)}
                          className="text-xs"
                        >
                          {showRaw ? "Hide JSON" : "View JSON"}
                        </Button>
                      </div>

                      {!showRaw ? (
                        <FormAnswersPretty data={booking.formAnswers} />
                      ) : (
                        <JsonBlock obj={booking.formAnswers} />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />
          <div className="px-6 py-3 flex justify-end">
            <Button variant="outline" onClick={close}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
