// app/components/services/providerBookings.ts
import type { Booking } from "@/types/booking";

const API_PREFIX = "/api/provider/bookings";

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok || json?.error || json?.message?.includes?.("Failed")) {
    const msg =
      json?.error ||
      json?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

// ✅ helpers
function asIsoDate(value: any, fallback = new Date().toISOString()): string {
  const v = value ?? fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function normalizeStatus(raw: any): Booking["status"] {
  const s = String(raw || "").toLowerCase();
  if (s === "pending" || s === "confirmed" || s === "completed" || s === "cancelled") {
    return s;
  }

  // backend variants mapping (optional)
  if (s === "paid" || s === "scheduled") return "confirmed";
  if (s === "in_progress" || s === "assigned" || s === "en_route") return "confirmed";
  if (s === "refunded") return "cancelled";

  return "pending";
}

/**
 * 🔹 List provider bookings
 * GET /api/provider/bookings
 */
export async function fetchProviderBookings(): Promise<{
  success: boolean;
  bookings: Booking[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const res = await fetch(API_PREFIX, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const json = await handleJsonResponse<{
    ok?: boolean;
    data?: { items?: any[]; pagination?: any };
    items?: any[];
    pagination?: any;
  }>(res);

  const rawItems: any[] = json.data?.items ?? json.items ?? [];
  const pagination = json.data?.pagination ?? json.pagination;

  const bookings: Booking[] = rawItems.map((b: any): Booking => {
    // ✅ createdAt required in type
    const createdAt = asIsoDate(b.createdAt ?? b.created_at ?? b?.meta?.createdAt);

    // scheduledAt can come from schedule.startAt etc
    const scheduledAt = asIsoDate(
      b.schedule?.startAt ??
        b.scheduledAt ??
        b.scheduled_at ??
        b.date ??
        b.startAt ??
        createdAt, // fallback to createdAt
      createdAt
    );

    const totalAmount =
      typeof b.price?.total === "number"
        ? b.price.total
        : typeof b.totalAmount === "number"
        ? b.totalAmount
        : typeof b.total === "number"
        ? b.total
        : 0;

    const customerId = String(b.customerId ?? b.customer?._id ?? b.customer?.id ?? "");
    const customerName = String(
      b.customerName ??
        b.customer?.name ??
        [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ") ??
        ""
    );

    // NOTE: Booking type me customerEmail hai hi nahi (tumhare shared type me),
    // isliye yahan include nahi kar rahe.
    // Agar tum email bhi chahte ho to types/booking.ts me add karo as optional.

    return {
      _id: String(b._id ?? b.id ?? ""),
      code: String(b.code ?? b.bookingCode ?? ""),
      customerId,
      customerName,
      serviceName: String(b.serviceName ?? b.service?.name ?? ""),
      status: normalizeStatus(b.status),
      scheduledAt,
      createdAt,
      totalAmount,
    };
  });

  return {
    success: Boolean(json.ok ?? true),
    bookings,
    pagination,
  };
}

/**
 * 🔹 Single provider booking detail
 * GET /api/provider/bookings/:id
 */
export async function fetchProviderBookingById(
  id: string
): Promise<{ success: boolean; booking: any }> {
  if (!id) throw new Error("Booking id is required");

  const res = await fetch(`${API_PREFIX}/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const json = await handleJsonResponse<{
    ok?: boolean;
    data?: { booking?: any };
    booking?: any;
  }>(res);

  const booking = json.data?.booking ?? json.booking ?? json;

  return {
    success: Boolean(json.ok ?? true),
    booking,
  };
}