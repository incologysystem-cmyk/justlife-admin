// app/api/provider/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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

async function authHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("accessToken")?.value ||
    cookieStore.get("token")?.value ||
    null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/provider/bookings  →  forwards to backend /api/bookings
export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.search || "";
    const headers = await authHeaders();

    // Backend: /api/bookings (already provider/admin guarded)
    const out = await serverFetch<any>(`${base()}/api/bookings${qs}`, {
      method: "GET",
      headers: { ...headers, Accept: "application/json" },
    });

    const items: any[] =
      Array.isArray(out?.items) ? out.items :
      Array.isArray(out?.data?.items) ? out.data.items :
      Array.isArray(out?.data) ? out.data :
      Array.isArray(out) ? out :
      [];

    const pagination =
      out?.pagination ??
      out?.data?.pagination ??
      null;

    return NextResponse.json(
      { ok: true, data: { items, pagination } },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("GET /api/provider/bookings error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch provider bookings" },
      { status: e?.status ?? 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

export async function HEAD() {
  return NextResponse.json({ ok: true });
}
