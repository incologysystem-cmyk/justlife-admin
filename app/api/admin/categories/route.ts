// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string) {
  return String(s).toLowerCase().trim().replace(/["']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Allow preflight/probes to avoid 405s in some browsers/tools
export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
export async function HEAD() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const BASE =
      process.env.API_BASE?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (!BASE) {
      return NextResponse.json(
        { ok: false, message: "API_BASE (or NEXT_PUBLIC_API_BASE) is not set" },
        { status: 500 }
      );
    }

    const token = req.cookies.get("token")?.value;
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    // Your Express category list endpoint (catalog/public list)
    const raw = await serverFetch<any>(`${BASE}/api/category/catalog/categories`, {
      method: "GET",
      headers: { ...authHeaders, Accept: "application/json" },
    });

    const list: any[] =
      Array.isArray(raw?.data) ? raw.data :
      Array.isArray(raw?.categories) ? raw.categories :
      Array.isArray(raw) ? raw :
      [];

    const categories = list.map((c: any) => ({
      id: String(c?.id ?? c?._id ?? ""),
      name: String(c?.name ?? ""),
      slug: String(c?.slug ?? slugify(String(c?.name ?? ""))),
      order: Number.isFinite(Number(c?.order))
        ? Number(c.order)
        : Number.isFinite(Number(c?.sort))
        ? Number(c.sort)
        : 0,
      icon: c?.icon,
      active: typeof c?.active === "boolean" ? c.active : true,
      tags: Array.isArray(c?.tags) ? c.tags : [],
      image: c?.image,
    }));

    return NextResponse.json({ ok: true, data: { categories } }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/categories error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const BASE =
      process.env.API_BASE?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (!BASE) {
      return NextResponse.json(
        { ok: false, message: "API_BASE (or NEXT_PUBLIC_API_BASE) is not set" },
        { status: 500 }
      );
    }

    const token = req.cookies.get("token")?.value;
    const authHeaders: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await serverFetch(`${BASE}/api/category/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(response, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/admin/categories error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed" }, { status: 500 });
  }
}
