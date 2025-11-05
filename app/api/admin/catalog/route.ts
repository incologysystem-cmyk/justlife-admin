// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

    // 🔗 Hit your Express router path
    const raw = await serverFetch<any>(`${BASE}/api/category/catalog/categories`, {
      method: "GET",
      headers: { ...authHeaders, Accept: "application/json" },
    });

    // Accept common shapes: {data:[...]}, {categories:[...]}, [...]
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
      // pass through anything else you keep on Category
      icon: c?.icon,
      active: typeof c?.active === "boolean" ? c.active : true,
    }));

    return NextResponse.json({ ok: true, data: { categories } });
  } catch (e: any) {
    console.error("GET /api/admin/categories error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Failed" }, { status: 500 });
  }
}
