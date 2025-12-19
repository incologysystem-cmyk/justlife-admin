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
  });

  const json = await handleJsonResponse<{
    ok?: boolean;
    data?: { items?: any[]; pagination?: any };
    items?: any[];
    pagination?: any;
  }>(res);

  const rawItems: any[] =
    json.data?.items ??
    json.items ??
    [];

  const pagination = json.data?.pagination ?? json.pagination;

  const bookings: Booking[] = rawItems.map((b: any) => {
    const scheduledAt =
      b.schedule?.startAt ||
      b.scheduledAt ||
      b.date ||
      b.createdAt ||
      new Date().toISOString();

    const totalAmount =
      typeof b.price?.total === "number"
        ? b.price.total
        : typeof b.total === "number"
        ? b.total
        : 0;

    return {
      _id: b._id || b.id,
      code: b.code || b.bookingCode || "",
      customerId: b.customerId || "",
      customerName: b.customerName || "",
      customerEmail: b.customerEmail || "",
      serviceId: b.serviceId || "",
      serviceName: b.serviceName || "",
      city: b.address?.city,
      status: b.status || "paid",
      scheduledAt,
      totalAmount,
    } as Booking;
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
  if (!id) {
    throw new Error("Booking id is required");
  }

  const res = await fetch(`${API_PREFIX}/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
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
