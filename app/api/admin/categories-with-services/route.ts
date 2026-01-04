// app/api/admin/categories-with-services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies as getCookies } from "next/headers";

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
    // ✅ Backend base URL (Express API)
    const BASE =
      process.env.API_BASE?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");

    if (!BASE) {
      return NextResponse.json(
        { ok: false, message: "API_BASE (or NEXT_PUBLIC_API_BASE) is not set" },
        { status: 500 }
      );
    }

    // 🔐 Cookies + token uthao (provider-scoped backend ko forward karne ke liye)
    const store = await getCookies();
    const cookieHeader = store
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const token = store.get("token")?.value;
    const incomingAuth =
      req.headers.get("authorization") || req.headers.get("Authorization");

    const apiKeyName = process.env.API_KEY_HEADER || "x-api-key";
    const apiKey = process.env.API_KEY;

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (cookieHeader) {
      (headers as any).Cookie = cookieHeader;
    }

    if (incomingAuth) {
      headers["Authorization"] = incomingAuth;
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (apiKey) {
      headers[apiKeyName] = apiKey;
    }

    // 🔗 Direct call to Express backend (NO serverFetch here)
    const url = `${BASE}/api/category/admin/categories-with-services`;
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const msg =
        (isJSON ? (body as any)?.message : undefined) ||
        (typeof body === "string" && body) ||
        `HTTP ${res.status}`;
      console.error("Backend /categories-with-services error:", msg);
      return NextResponse.json({ ok: false, message: msg }, { status: res.status });
    }

    // Backend expected shapes:
    //  - { data: [...] }
    //  - [...]
    const rows: any[] = Array.isArray((body as any)?.data)
      ? (body as any).data
      : Array.isArray(body)
      ? (body as any)
      : [];

    // 🔄 Normalize to the shape your frontend expects
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
          image:
            Array.isArray(s?.images) && s.images.length
              ? String(s.images[0])
              : undefined,
        })),
      };
    });

    return NextResponse.json({ ok: true, data: normalized }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/categories-with-services error:", e);
    const msg = e?.message || "Failed";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
