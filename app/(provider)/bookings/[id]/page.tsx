// app/dashboard/bookings/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Booking = {
  _id: string;
  serviceId?: string;
  serviceName: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  phone?: string;

  address?: {
    line1?: string;
    building?: string;
    community?: string;
    unit?: string;
    city?: string;
    notes?: string;
  };

  qty: number;
  variantId?: string | null;

  addonItems?: Array<{
    name: string;
    qty: number;
    unitPrice: number;
  }>;

  formAnswers?: Record<string, any>;

  schedule?: {
    startAt: string;
    timeSlot?: string;
    tz?: string;
    frequency: string;
  };

  price?: {
    currency: string;
    base: number;
    addons: number;
    vat: number;
    fees: number;
    discount: number;
    total: number;
    promoCode?: string;
  };

  stripe?: {
    sessionId?: string;
    paymentIntentId?: string;
  };

  providerId?: string;

  status: string;
  createdAt?: string;
  updatedAt?: string;
};

const statusClass = (status: string | undefined) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "in_progress":
    case "assigned":
    case "en_route":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "completed":
      return "bg-slate-900 text-slate-50 border-slate-800";
    case "cancelled":
    case "refunded":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

// 🧾 Provider-side fetch
async function fetchProviderBookingById(id: string): Promise<Booking> {
  const res = await fetch(`/api/provider/bookings/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  const booking =
    (data as any)?.data?.booking ?? (data as any)?.booking ?? data;

  return booking as Booking;
}

export default function ProviderBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    (async () => {
      try {
        const b = await fetchProviderBookingById(bookingId);
        if (!mounted) return;
        setBooking(b);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load booking");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const scheduled = useMemo(() => {
    if (!booking?.schedule?.startAt) return "—";
    const d = new Date(booking.schedule.startAt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }, [booking]);

  const createdAt = useMemo(() => {
    if (!booking?.createdAt) return "—";
    const d = new Date(booking.createdAt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }, [booking]);

  const updatedAt = useMemo(() => {
    if (!booking?.updatedAt) return "—";
    const d = new Date(booking.updatedAt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }, [booking]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading booking…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">
            {error || "Booking not found"}
          </p>
        </div>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center text-xs font-medium text-blue-600 underline"
        >
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const shortSession =
    booking.stripe?.sessionId &&
    booking.stripe.sessionId.length > 16
      ? booking.stripe.sessionId.slice(0, 8) +
        "…" +
        booking.stripe.sessionId.slice(-4)
      : booking.stripe?.sessionId || "—";

  const shortPI =
    booking.stripe?.paymentIntentId &&
    booking.stripe.paymentIntentId.length > 14
      ? booking.stripe.paymentIntentId.slice(0, 6) +
        "…" +
        booking.stripe.paymentIntentId.slice(-4)
      : booking.stripe?.paymentIntentId || "—";

  return (
    <div className="space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-700">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/bookings" className="hover:text-slate-700">
              Bookings
            </Link>
            <span>/</span>
            <span>Detail</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            {booking.serviceName}
          </h1>
          <p className="text-xs text-slate-500">
            Customer:{" "}
            <span className="font-medium text-slate-800">
              {booking.customerName || "—"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${statusClass(
              booking.status
            )}`}
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {booking.status || "Unknown"}
          </span>

          <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
            Qty: <span className="font-semibold">{booking.qty ?? 1}</span>
          </div>

          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to bookings
          </Link>
        </div>
      </div>

      {/* Top grid: Customer / Schedule / Price Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Customer card */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Customer
          </h2>
          <div className="space-y-1 text-xs text-slate-600">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {booking.customerName || "—"}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {booking.customerEmail || "—"}
            </p>
            <p>
              <span className="font-medium">Phone:</span>{" "}
              {booking.phone || "—"}
            </p>
            {booking.customerId && (
              <p className="mt-2 text-[11px] text-slate-500">
                Customer ID:{" "}
                <span className="font-mono">
                  {booking.customerId}
                </span>
              </p>
            )}
          </div>
        </section>

        {/* Schedule card */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Schedule
          </h2>
          <div className="space-y-1 text-xs text-slate-600">
            <p>
              <span className="font-medium">Date &amp; time:</span>{" "}
              {scheduled}
            </p>
            <p>
              <span className="font-medium">Time slot:</span>{" "}
              {booking.schedule?.timeSlot || "—"}
            </p>
            <p>
              <span className="font-medium">Timezone:</span>{" "}
              {booking.schedule?.tz || "—"}
            </p>
            <p>
              <span className="font-medium">Frequency:</span>{" "}
              {booking.schedule?.frequency || "once"}
            </p>
            {booking.variantId && (
              <p>
                <span className="font-medium">Variant ID:</span>{" "}
                <span className="font-mono text-[11px]">
                  {booking.variantId}
                </span>
              </p>
            )}
          </div>
        </section>

        {/* Price summary card */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Price summary
          </h2>
          <div className="space-y-1 text-xs text-slate-600">
            <p>
              <span className="font-medium">Currency:</span>{" "}
              {booking.price?.currency || "—"}
            </p>
            <p>
              <span className="font-medium">Base:</span>{" "}
              {booking.price?.base ?? 0}
            </p>
            <p>
              <span className="font-medium">Add-ons:</span>{" "}
              {booking.price?.addons ?? 0}
            </p>
            <p>
              <span className="font-medium">Fees:</span>{" "}
              {booking.price?.fees ?? 0}
            </p>
            <p>
              <span className="font-medium">Discount:</span>{" "}
              {booking.price?.discount ?? 0}
            </p>
            {booking.price?.promoCode && (
              <p>
                <span className="font-medium">Promo code:</span>{" "}
                {booking.price.promoCode}
              </p>
            )}
            <p className="mt-2 border-t border-dashed border-slate-200 pt-2 text-sm font-semibold text-slate-900">
              Total:{" "}
              <span className="font-mono">
                {booking.price?.total ?? 0}
              </span>
            </p>
          </div>
        </section>
      </div>

      {/* Bottom grid: Address / Addons & Form / Payment & Meta */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Address */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Service address
            </h2>
            <div className="space-y-1 text-xs text-slate-600">
              {booking.address ? (
                <>
                  {booking.address.line1 && <p>{booking.address.line1}</p>}
                  {booking.address.building && <p>{booking.address.building}</p>}
                  {booking.address.community && (
                    <p>{booking.address.community}</p>
                  )}
                  {(booking.address.city || booking.address.unit) && (
                    <p>
                      {[booking.address.city, booking.address.unit]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                  {typeof booking.address.notes === "string" &&
                    booking.address.notes.trim().length > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Notes: {booking.address.notes}
                      </p>
                    )}
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  No address stored for this booking.
                </p>
              )}
            </div>
          </section>

          {/* Add-ons */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Add-ons
            </h2>
            {Array.isArray(booking.addonItems) &&
            booking.addonItems.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-600">
                {booking.addonItems.map((a, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1"
                  >
                    <span className="truncate">{a.name || "Addon"}</span>
                    <span className="text-[11px] text-slate-500">
                      x{a.qty} @ {a.unitPrice}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">
                No add-ons selected.
              </p>
            )}
          </section>

          {/* Form answers */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Form answers
            </h2>
            {booking.formAnswers &&
            Object.keys(booking.formAnswers).length > 0 ? (
              <dl className="space-y-1 text-xs text-slate-600">
                {Object.entries(booking.formAnswers).map(
                  ([key, value]) => (
                    <div key={key} className="flex text-[11px]">
                      <dt className="w-24 flex-shrink-0 font-medium capitalize text-slate-700">
                        {key}:
                      </dt>
                      <dd className="flex-1">
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value)}
                      </dd>
                    </div>
                  )
                )}
              </dl>
            ) : (
              <p className="text-xs text-slate-500">
                No additional form data.
              </p>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Payment */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Payment / Stripe
            </h2>
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                <span className="font-medium">Status:</span>{" "}
                {booking.status}
              </p>
              <p>
                <span className="font-medium">Session ID:</span>{" "}
                <span className="font-mono text-[11px]">{shortSession}</span>
              </p>
              <p>
                <span className="font-medium">Payment Intent:</span>{" "}
                <span className="font-mono text-[11px]">{shortPI}</span>
              </p>
            </div>
          </section>

          {/* Meta */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Meta
            </h2>
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                <span className="font-medium">Service ID:</span>{" "}
                <span className="font-mono text-[11px]">
                  {booking.serviceId || "—"}
                </span>
              </p>
              {booking.providerId && (
                <p>
                  <span className="font-medium">Provider ID:</span>{" "}
                  <span className="font-mono text-[11px]">
                    {booking.providerId}
                  </span>
                </p>
              )}
              <p>
                <span className="font-medium">Created at:</span>{" "}
                {createdAt}
              </p>
              <p>
                <span className="font-medium">Updated at:</span>{" "}
                {updatedAt}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
