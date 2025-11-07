import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function base() {
  const b =
    process.env.API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (!b) throw new Error("API_BASE (or NEXT_PUBLIC_API_BASE) is not set");
  return b;
}

// Get auth headers from cookies
async function authHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.search || "";
    const authHeadersValue = await authHeaders();
    
    const out = await serverFetch<any>(`${base()}/api/bookings${qs}`, {
      method: "GET",
      headers: { ...authHeadersValue, Accept: "application/json" },
    });

    const items: any[] =
      Array.isArray(out?.items) ? out.items :
      Array.isArray(out?.data?.items) ? out.data.items :
      Array.isArray(out?.data) ? out.data :
      Array.isArray(out) ? out : [];

    return NextResponse.json({ ok: true, data: { items } });
  } catch (e: any) {
    console.error("GET /api/admin/bookings error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch bookings" },
      { status: e?.status ?? 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeadersValue = await authHeaders();
    
    const out = await serverFetch<any>(`${base()}/api/bookings`, {
      method: "POST",
      headers: {
        ...authHeadersValue,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/admin/bookings error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to create booking" },
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