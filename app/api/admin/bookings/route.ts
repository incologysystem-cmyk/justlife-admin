import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // resolve your base URL (Express server)
    const BASE =
      process.env.API_BASE?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (!BASE) {
      return NextResponse.json(
        { ok: false, message: "API_BASE (or NEXT_PUBLIC_API_BASE) is not set" },
        { status: 500 }
      );
    }

    // read cookie set by Next (usually "token" or "accessToken")
    const token = req.cookies.get("token")?.value || req.cookies.get("accessToken")?.value;

    const authHeaders: HeadersInit = token
      ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
      : { Accept: "application/json" };

    // hit Express endpoint
    const data = await serverFetch<any>(`${BASE}/api/bookings`, {
      method: "GET",
      headers: authHeaders,
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("GET /api/admin/bookings error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed to fetch bookings" }, { status: 500 });
  }
}
