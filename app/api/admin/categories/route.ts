// app/api/admin/categories/route.ts
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

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.categories)) return raw.categories;
  if (Array.isArray(raw)) return raw;
  return [];
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
    const authHeaders: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const raw = await serverFetch<any>(`${BASE}/api/category/admin/categories`, {
      method: "GET",
      headers: { ...authHeaders, Accept: "application/json" },
    });

    const list = normalizeList(raw);

    const categories = list.map((c: any) => ({
      id: String(c?.id ?? c?._id ?? ""),
      _id: c?._id ? String(c._id) : undefined,
      name: String(c?.name ?? ""),
      slug: String(c?.slug ?? slugify(String(c?.name ?? ""))),
      order: Number.isFinite(Number(c?.order))
        ? Number(c.order)
        : Number.isFinite(Number(c?.sort))
        ? Number(c.sort)
        : 0,
      active: typeof c?.active === "boolean" ? c.active : true,
      tags: Array.isArray(c?.tags) ? c.tags : [],
      image: c?.image ?? "",
      providerId:
        c?.providerId === null || c?.providerId === undefined
          ? null
          : String(c.providerId),
      createdAt: c?.createdAt,
      updatedAt: c?.updatedAt,
    }));

    return NextResponse.json({ ok: true, data: { categories } }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/categories error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed" },
      { status: e?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    console.log("🟦 [NEXT] POST /api/admin/categories incoming body:", body);

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const payload = {
      name,
      slug: String(body?.slug ?? "").trim() || undefined,
      description: body?.description ? String(body.description) : undefined,
      active: body?.active,
      order:
        body?.order !== undefined
          ? Number(body.order)
          : body?.sort !== undefined
          ? Number(body.sort)
          : 0,
      providerId:
        body?.providerId === null ||
        body?.providerId === "" ||
        body?.providerId === undefined
          ? body?.providerId === null
            ? null
            : undefined
          : String(body.providerId),
    };

    console.log("🟦 [NEXT] forwarding payload to Express:", payload);

    const token = req.cookies.get("token")?.value;
    const authHeaders: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const raw = await serverFetch<any>(`${BASE}/api/category/admin/categories`, {
      method: "POST",
      headers: {
        ...authHeaders,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("🟩 [NEXT] Express response (raw):", raw);

    // ✅ ensure created doc has id for frontend
    const createdDoc =
      raw?.data?.category ?? raw?.data ?? raw?.category ?? raw?.item ?? raw;

    const id = String(createdDoc?.id ?? createdDoc?._id ?? "").trim();
    if (!id) {
      console.error("❌ [NEXT] created category missing id/_id:", createdDoc);
      return NextResponse.json(
        { ok: false, message: "Created but no id returned from backend", raw },
        { status: 502 }
      );
    }

    const fixed = {
      ...raw,
      data: {
        ...createdDoc,
        id,
        _id: String(createdDoc?._id ?? id),
      },
    };

    console.log("🟩 [NEXT] fixedDoc id/_id:", {
      id: fixed.data.id,
      _id: fixed.data._id,
    });

    return NextResponse.json(fixed, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/admin/categories error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed" },
      { status: e?.status || 500 }
    );
  }
}
