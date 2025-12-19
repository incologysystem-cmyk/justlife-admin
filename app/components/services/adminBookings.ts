// admin/services/adminBookings.ts
import type { BookingsResponse, Booking } from "@/types/booking";

export async function fetchBookings(
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
    providerId?: string;
  }
): Promise<BookingsResponse> {
  const search = new URLSearchParams();

  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  if (params?.q) search.set("q", params.q);
  if (params?.providerId) search.set("providerId", params.providerId);

  const qs = search.toString();
  const url = qs
    ? `/api/admin/bookings?${qs}`
    : `/api/admin/bookings`;

  const res = await fetch(url, {
    method: "GET",
    // Admin dashboard data fresh chahiye
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch bookings:", res.status);
    throw new Error(`Failed to fetch bookings: ${res.status}`);
  }

  const data = (await res.json()) as {
    success: boolean;
    bookings: Booking[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };

  return data;
}
