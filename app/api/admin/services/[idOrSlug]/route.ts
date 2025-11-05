// app/api/admin/services/[idOrSlug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function base() {
  const b =
    process.env.API_BASE?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (!b) throw new Error("API_BASE (or NEXT_PUBLIC_API_BASE) is not set");
  return b;
}

function auth(req: NextRequest): HeadersInit {
  const token = req.cookies.get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/admin/services/:idOrSlug  -> forwards to GET /api/services/:idOrSlug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    if (!idOrSlug) {
      return NextResponse.json({ ok: false, message: "idOrSlug is required" }, { status: 400 });
    }
    const out = await serverFetch<any>(`${base()}/api/services/${encodeURIComponent(idOrSlug)}`, {
      method: "GET",
      headers: { ...auth(req), Accept: "application/json" },
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/services/[idOrSlug] error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed to fetch service" }, { status: e?.status ?? 500 });
  }
}

// PATCH /api/admin/services/:idOrSlug -> forwards to PATCH /api/services/:idOrSlug
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    if (!idOrSlug) {
      return NextResponse.json({ ok: false, message: "idOrSlug is required" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const out = await serverFetch<any>(`${base()}/api/services/${encodeURIComponent(idOrSlug)}`, {
      method: "PATCH",
      headers: { ...auth(req), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/admin/services/[idOrSlug] error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed to update service" }, { status: e?.status ?? 500 });
  }
}

// DELETE /api/admin/services/:id  -> forwards to DELETE /api/services/:id
// NOTE: backend expects :id (NOT slug). Client calls this with the document _id.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    if (!idOrSlug) {
      return NextResponse.json({ ok: false, message: "id is required" }, { status: 400 });
    }
    const out = await serverFetch<any>(`${base()}/api/services/${encodeURIComponent(idOrSlug)}`, {
      method: "DELETE",
      headers: { ...auth(req), Accept: "application/json" },
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/admin/services/[idOrSlug] error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed to delete service" }, { status: e?.status ?? 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
export async function HEAD() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
