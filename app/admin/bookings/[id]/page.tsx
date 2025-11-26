// app/admin/bookings/[id]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchBookingById } from "@/app/components/services/adminCustomers";

const statusClass = (status: string | undefined) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "in_progress":
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

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params?.id as string | undefined;

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await fetchBookingById(bookingId);
        if (!mounted) return;
        setBooking(res.booking);
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
          href="/admin/customers"
          className="inline-flex items-center text-xs font-medium text-blue-600 underline"
        >
          ← Back to customers
        </Link>
      </div>
    );
  }

  const shortService =
    booking.serviceName?.length > 40
      ? booking.serviceName.slice(0, 40) + "…"
      : booking.serviceName;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Link href="/admin/customers" className="hover:text-slate-700">
              Customers
            </Link>
            <span>/</span>
            <span>Booking detail</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            Booking detail
          </h1>
          <p className="text-xs text-slate-500">
            Service:&nbsp;
            <span className="font-medium text-slate-800">
              {shortService || "—"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
              booking.status
            )}`}
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {booking.status || "Unknown"}
          </span>
          <Link
            href="/admin/customers"
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to customers
          </Link>
        </div>
      </div>

      {/* Top grid: customer + schedule + price */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Customer */}
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Customer
          </h2>
          <dl className="space-y-1.5 text-xs text-slate-700">
            <div className="flex">
              <dt className="w-20 text-slate-500">Name</dt>
              <dd className="flex-1">
                {booking.customerName || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-20 text-slate-500">Email</dt>
              <dd className="flex-1">
                {booking.customerEmail || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-20 text-slate-500">Phone</dt>
              <dd className="flex-1">
                {booking.phone || "—"}
              </dd>
            </div>
            <div className="mt-2 flex">
              <dt className="w-20 text-slate-500">Customer ID</dt>
              <dd className="flex-1 font-mono text-[11px] text-slate-600">
                {booking.customerId || "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Schedule */}
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Schedule
          </h2>
          <dl className="space-y-1.5 text-xs text-slate-700">
            <div className="flex">
              <dt className="w-24 text-slate-500">Date &amp; time</dt>
              <dd className="flex-1">{scheduled}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Time slot</dt>
              <dd className="flex-1">
                {booking.schedule?.timeSlot || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Timezone</dt>
              <dd className="flex-1">
                {booking.schedule?.tz || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Frequency</dt>
              <dd className="flex-1">
                {booking.schedule?.frequency || "once"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Quantity</dt>
              <dd className="flex-1">{booking.qty ?? 1}</dd>
            </div>
            {booking.variantId && (
              <div className="flex">
                <dt className="w-24 text-slate-500">Variant ID</dt>
                <dd className="flex-1 font-mono text-[11px] text-slate-600 break-all">
                  {booking.variantId}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Price */}
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Price
          </h2>
          <dl className="space-y-1.5 text-xs text-slate-700">
            <div className="flex">
              <dt className="w-24 text-slate-500">Currency</dt>
              <dd className="flex-1">
                {booking.price?.currency || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Base</dt>
              <dd className="flex-1">
                {booking.price?.base ?? 0}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Addons</dt>
              <dd className="flex-1">
                {booking.price?.addons ?? 0}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Fees</dt>
              <dd className="flex-1">
                {booking.price?.fees ?? 0}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Discount</dt>
              <dd className="flex-1">
                {booking.price?.discount ?? 0}
              </dd>
            </div>
            {booking.price?.promoCode && (
              <div className="flex">
                <dt className="w-24 text-slate-500">Promo code</dt>
                <dd className="flex-1">
                  {booking.price.promoCode}
                </dd>
              </div>
            )}
            <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
              <p className="text-xs text-slate-500">Total</p>
              <p className="font-mono text-sm font-semibold text-slate-900">
                {booking.price?.total ?? 0}
              </p>
            </div>
          </dl>
        </section>
      </div>

      {/* Bottom grid: left (address/addons/form) + right (payment/meta) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Address */}
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Address
            </h2>
            <div className="space-y-1 text-xs text-slate-700">
              {booking.address ? (
                <>
                  {booking.address.line1 && <p>{booking.address.line1}</p>}
                  {booking.address.building && <p>{booking.address.building}</p>}
                  {booking.address.community && (
                    <p>{booking.address.community}</p>
                  )}
                  {(booking.address.city || booking.address.unit) && (
                    <p className="text-[11px] text-slate-500">
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
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Add-ons
            </h2>
            {Array.isArray(booking.addonItems) &&
            booking.addonItems.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-700">
                {booking.addonItems.map((a: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1"
                  >
                    <span className="truncate">
                      {a.name || "Addon"}
                    </span>
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
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Form answers
            </h2>
            {booking.formAnswers &&
            Object.keys(booking.formAnswers).length > 0 ? (
              <dl className="space-y-1.5 text-xs text-slate-700">
                {Object.entries(booking.formAnswers).map(
                  ([key, value]: [string, any]) => (
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
          {/* Payment / Stripe */}
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Payment / Stripe
            </h2>
            <div className="space-y-3">
              {/* Status pill row */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Payment status
                  </p>
                  <p className="text-xs font-semibold text-slate-900">
                    {booking.status || "—"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                    booking.status
                  )}`}
                >
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  {booking.status || "Unknown"}
                </span>
              </div>

              {/* Session ID */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Session ID
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-800">
                  {booking.stripe?.sessionId || "—"}
                </p>
              </div>

              {/* Payment Intent */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Payment Intent
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-800">
                  {booking.stripe?.paymentIntentId || "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Meta (no Booking ID) */}
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Meta
            </h2>
            <dl className="space-y-1.5 text-xs text-slate-700">
              <div className="flex">
                <dt className="w-24 text-slate-500">Created at</dt>
                <dd className="flex-1">{createdAt}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-slate-500">Updated at</dt>
                <dd className="flex-1">{updatedAt}</dd>
              </div>
              {booking.providerId && (
                <div className="flex">
                  <dt className="w-24 text-slate-500">Provider ID</dt>
                  <dd className="flex-1 font-mono text-[11px] text-slate-600 break-all">
                    {booking.providerId}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
