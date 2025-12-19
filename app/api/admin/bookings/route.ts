// src/app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function base() {
  const b =
    process.env.API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (!b) throw new Error("API_BASE (or NEXT_PUBLIC_API_BASE) is not set");
  return b;
}

function auth(req: NextRequest): HeadersInit {
  const token =
    req.cookies.get("accessToken")?.value ||
    req.cookies.get("token")?.value ||
    undefined;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const toNum = (val: string | null, def: number) => {
  const n = val ? Number(val) : NaN;
  return Number.isFinite(n) ? n : def;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const q = searchParams.get("q");
    const providerId = searchParams.get("providerId");

    const backendUrl = new URL("/api/bookings", base());

    if (page) backendUrl.searchParams.set("page", page);
    if (limit) backendUrl.searchParams.set("limit", limit);
    if (status) backendUrl.searchParams.set("status", status);
    if (serviceId) backendUrl.searchParams.set("serviceId", serviceId);
    if (from) backendUrl.searchParams.set("from", from);
    if (to) backendUrl.searchParams.set("to", to);
    if (q) backendUrl.searchParams.set("q", q);
    if (providerId) backendUrl.searchParams.set("providerId", providerId);

    // 🔹 Backend: Express listBookingsController (admin/provider)
    const raw = await serverFetch<any>(backendUrl.toString(), {
      method: "GET",
      headers: {
        ...auth(req),
        Accept: "application/json",
      },
    });

    // serverFetch usually returns { data: <real JSON>, ... }
    let api = raw?.data ?? raw;

    // safety: kabhi kabhi double-wrap bhi ho sakta hai
    if (api?.data) api = api.data;

    // Backend shape: { ok: true, items, pagination, total, pages }
    const items = Array.isArray(api?.items) ? api.items : [];

    const bookings = items.map((b: any) => {
      const scheduleStart =
        b.schedule?.startAt || b.date || b.createdAt || new Date().toISOString();

      let totalAmount = 0;
      if (b.price && typeof b.price.total === "number") totalAmount = b.price.total;
      else if (typeof b.total === "number") totalAmount = b.total;
      else if (typeof b.totalPrice === "number") totalAmount = b.totalPrice;
      else if (typeof b.grandTotal === "number") totalAmount = b.grandTotal;
      else if (b.breakdown && typeof b.breakdown.total === "number")
        totalAmount = b.breakdown.total;

      return {
        _id: String(b._id),
        code: b.code || b.bookingCode || b.reference || "",
        customerName: b.customerName || "",
        customerId: b.customerId ? String(b.customerId) : "",
        serviceName: b.serviceName || "",
        status: b.status || "pending",
        scheduledAt: new Date(scheduleStart).toISOString(),
        createdAt: new Date(b.createdAt || scheduleStart).toISOString(),
        totalAmount,
      };
    });

    const pageVal = page ?? String(api?.pagination?.page ?? 1);
    const limitVal = limit ?? String(api?.pagination?.limit ?? 20);

    return NextResponse.json(
      {
        success: true,
        bookings,
        pagination: api?.pagination ?? {
          page: toNum(pageVal, 1),
          limit: toNum(limitVal, 20),
          total: api?.total ?? bookings.length,
          pages: api?.pages ?? 1,
        },
        // dev debugging ke liye helpful, prod me ignore bhi kar sakte ho:
        // debugRaw: process.env.NODE_ENV !== "production" ? api : undefined,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("GET /api/admin/bookings error:", e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Failed to load bookings",
      },
      { status: e?.status ?? 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
export async function HEAD() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
