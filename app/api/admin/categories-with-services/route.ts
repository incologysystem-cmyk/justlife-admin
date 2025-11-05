import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const headers: HeadersInit = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const raw = await serverFetch<any>(
      `${BASE}/api/category/catalog/categories-with-services`,
      { method: "GET", headers }
    );

    const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const normalized = rows.map((r: any) => {
      const c = r?.category ?? {};
      const svcs = Array.isArray(r?.services) ? r.services : [];
      return {
        category: {
          id: String(c?.id ?? c?._id ?? ""),
          name: String(c?.name ?? ""),
          slug: String(c?.slug ?? ""),
          order: Number.isFinite(Number(c?.order))
            ? Number(c.order)
            : Number.isFinite(Number(c?.sort))
            ? Number(c.sort)
            : 0,
          image: c?.image,
          active: typeof c?.active === "boolean" ? c.active : true,
          tags: Array.isArray(c?.tags) ? c.tags : [],
        },
        services: svcs.map((s: any) => ({
          id: String(s?.id ?? s?._id ?? ""),
          name: String(s?.name ?? ""),
          categoryId: String(s?.categoryId ?? s?.category_id ?? ""),
          basePrice: Number(s?.basePrice ?? s?.base_price ?? 0),
          image: Array.isArray(s?.images) && s.images.length ? String(s.images[0]) : undefined,
        })),
      };
    });

    return NextResponse.json({ ok: true, data: normalized }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/categories-with-services error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed" }, { status: 500 });
  }
}
