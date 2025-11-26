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
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "scheduled":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "completed":
      return "bg-slate-900 text-slate-50 ring-1 ring-slate-800";
    case "cancelled":
    case "refunded":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
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

  const isUpcoming = useMemo(() => {
    if (!booking?.schedule?.startAt) return false;
    const d = new Date(booking.schedule.startAt);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() > Date.now();
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
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3">
          <p className="text-sm font-medium text-rose-700">
            {error || "Booking not found"}
          </p>
        </div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top header */}
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Link href="/admin/customers" className="hover:text-slate-700">
              Customers
            </Link>
            <span>/</span>
            <span>Booking</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900">
              Booking{" "}
              <span className="font-mono text-[12px] text-slate-600">
                #{booking._id}
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Service:{" "}
            <span className="font-medium text-slate-800">
              {booking.serviceName}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(
                booking.status
              )}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {booking.status || "Unknown"}
            </span>
            {booking.price?.total != null && (
              <span className="inline-flex items-baseline rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-50">
                <span className="mr-1 text-[10px] uppercase opacity-70">
                  Total
                </span>
                <span className="font-mono">
                  {booking.price.currency || "AED"} {booking.price.total}
                </span>
              </span>
            )}
          </div>
          <Link
            href="/admin/customers"
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to customers
          </Link>
        </div>
      </header>

      {/* Quick summary bar */}
      <section className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 sm:grid-cols-3">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Scheduled
          </span>
          <span className="mt-0.5 font-medium">
            {scheduled}
            {isUpcoming && (
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                Upcoming
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Qty • Variant
          </span>
          <span className="mt-0.5 font-medium">
            {booking.qty ?? 1}
            {booking.variantId && (
              <span className="ml-2 font-mono text-[11px] text-slate-600">
                {booking.variantId}
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Created / Updated
          </span>
          <span className="mt-0.5">
            <span className="block">{createdAt}</span>
            <span className="block text-[11px] text-slate-500">
              Last update: {updatedAt}
            </span>
          </span>
        </div>
      </section>

      {/* Main sections */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Customer */}
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Customer
          </h2>
          <dl className="space-y-1.5 text-xs text-slate-700">
            <div className="flex">
              <dt className="w-24 text-slate-500">Name</dt>
              <dd className="flex-1 font-medium">
                {booking.customerName || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Email</dt>
              <dd className="flex-1 break-all">
                {booking.customerEmail || "—"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Phone</dt>
              <dd className="flex-1">
                {booking.phone || "—"}
              </dd>
            </div>
            <div className="mt-2 flex">
              <dt className="w-24 text-slate-500">Customer ID</dt>
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
            {booking.schedule?.until && (
              <div className="flex">
                <dt className="w-24 text-slate-500">Until</dt>
                <dd className="flex-1">
                  {new Date(booking.schedule.until).toLocaleDateString()}
                </dd>
              </div>
            )}
            {typeof booking.schedule?.count === "number" && (
              <div className="flex">
                <dt className="w-24 text-slate-500">Occurrences</dt>
                <dd className="flex-1">
                  {booking.schedule.count}
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
              <dd className="flex-1">{booking.price?.base ?? 0}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Addons</dt>
              <dd className="flex-1">
                {booking.price?.addons ?? 0}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Fees</dt>
              <dd className="flex-1">{booking.price?.fees ?? 0}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-slate-500">Discount</dt>
              <dd className="flex-1">
                {booking.price?.discount ?? 0}
              </dd>
            </div>
            {booking.price?.promoCode && (
              <div className="flex">
                <dt className="w-24 text-slate-500">Promo</dt>
                <dd className="flex-1">
                  {booking.price.promoCode}
                </dd>
              </div>
            )}
            <div className="mt-2 flex border-t border-dashed border-slate-200 pt-2">
              <dt className="w-24 text-slate-500">Total</dt>
              <dd className="flex-1 font-mono text-sm font-semibold text-slate-900">
                {booking.price?.total ?? 0}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Bottom grid: Address / Addons / Form / Payment / Meta */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left side */}
        <div className="space-y-4">
          {/* Address */}
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Address
            </h2>
            <div className="space-y-1 text-xs text-slate-700">
              {booking.address ? (
                <>
                  {"line1" in booking.address && booking.address.line1 && (
                    <p>{booking.address.line1}</p>
                  )}
                  {"building" in booking.address &&
                    booking.address.building && (
                      <p>{booking.address.building}</p>
                    )}
                  {"community" in booking.address &&
                    booking.address.community && (
                      <p>{booking.address.community}</p>
                    )}
                  <p className="text-slate-600">
                    {[booking.address.city, booking.address.unit]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </p>
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
                    className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1"
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
                    <div key={key} className="flex">
                      <dt className="w-24 text-slate-500 capitalize">
                        {key}
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

        {/* Right side */}
        <div className="space-y-4">
          {/* Payment / Stripe */}
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Payment / Stripe
            </h2>
            <dl className="space-y-1.5 text-xs text-slate-700">
              <div className="flex">
                <dt className="w-28 text-slate-500">Status</dt>
                <dd className="flex-1">
                  {booking.status || "—"}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-28 text-slate-500">Session ID</dt>
                <dd className="flex-1 break-all text-[11px]">
                  {booking.stripe?.sessionId || "—"}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-28 text-slate-500">
                  Payment Intent
                </dt>
                <dd className="flex-1 break-all text-[11px]">
                  {booking.stripe?.paymentIntentId || "—"}
                </dd>
              </div>
            </dl>
          </section>

          {/* Meta */}
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Meta
            </h2>
            <dl className="space-y-1.5 text-xs text-slate-700">
              <div className="flex">
                <dt className="w-28 text-slate-500">Booking ID</dt>
                <dd className="flex-1 font-mono text-[11px] text-slate-600">
                  {booking._id}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-28 text-slate-500">Created at</dt>
                <dd className="flex-1">{createdAt}</dd>
              </div>
              <div className="flex">
                <dt className="w-28 text-slate-500">Updated at</dt>
                <dd className="flex-1">{updatedAt}</dd>
              </div>
              {booking.providerId && (
                <div className="flex">
                  <dt className="w-28 text-slate-500">Provider ID</dt>
                  <dd className="flex-1 font-mono text-[11px] text-slate-600">
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