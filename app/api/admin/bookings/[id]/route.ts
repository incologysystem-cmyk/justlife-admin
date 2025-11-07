// app/api/admin/bookings/[id]/route.ts
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

// GET /api/admin/bookings/:id -> forwards to GET /api/bookings/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const out = await serverFetch<any>(`${base()}/api/bookings/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { ...auth(req), Accept: "application/json" },
    });

    // Normalize common shapes
    const booking = out?.data?.booking ?? out?.booking ?? out;
    return NextResponse.json({ ok: true, data: { booking } }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/bookings/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch booking" },
      { status: e?.status ?? 500 }
    );
  }
}

// PATCH /api/admin/bookings/:id -> forwards to PATCH /api/bookings/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const out = await serverFetch<any>(`${base()}/api/bookings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...auth(req), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/admin/bookings/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to update booking" },
      { status: e?.status ?? 500 }
    );
  }
}

// DELETE /api/admin/bookings/:id -> forwards to DELETE /api/bookings/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const out = await serverFetch<any>(`${base()}/api/bookings/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...auth(req), Accept: "application/json" },
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/admin/bookings/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to delete booking" },
      { status: e?.status ?? 500 }
    );
  }
}

export async function OPTIONS() { return NextResponse.json({ ok: true }, { status: 200 }); }
export async function HEAD()    { return NextResponse.json({ ok: true }, { status: 200 }); }
