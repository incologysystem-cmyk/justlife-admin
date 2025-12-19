// app/api/provider/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickBase() {
  const b =
    // ✅ Provider panel envs first
    process.env.PROVIDER_API_BASE?.replace(/\/$/, "") ||
    process.env.API_BASE_PROVIDER?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_PROVIDER_API_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_PROVIDER_API_BASE?.replace(/\/$/, "") ||
    // fallback
    process.env.API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");

  if (!b) throw new Error("No API base URL set (provider or default)");
  return b;
}

async function authHeadersFromCookies(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("accessToken")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("providerToken")?.value ||
    null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Allow preflight/probes
export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
export async function HEAD() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const onlyActive = req.nextUrl.searchParams.get("onlyActive") === "true";

    const base = pickBase();

    // ✅ FIX: provider/admin endpoint (auth required)
    const url = new URL(`${base}/api/category/admin/categories`);
    // (optional) backend ko bhi hint de do
    if (onlyActive) url.searchParams.set("active", "true");

    const cookieAuth = await authHeadersFromCookies();
    const incomingAuth = req.headers.get("authorization");

    const headers: HeadersInit = {
      Accept: "application/json",
      ...(incomingAuth ? { Authorization: incomingAuth } : {}),
      ...cookieAuth,
    };

    const hasAuth = Boolean(
      (incomingAuth && incomingAuth.toLowerCase().startsWith("bearer ")) ||
        (cookieAuth as any)?.Authorization
    );

    const raw = await serverFetch<any>(url.toString(), {
      method: "GET",
      headers,
    });

    // 🔎 server logs (remove later)
    console.log("[provider/categories] base:", base);
    console.log("[provider/categories] url:", url.toString());
    console.log("[provider/categories] hasAuth:", hasAuth);
    console.log("[provider/categories] backend raw:", JSON.stringify(raw));

    // ✅ handle BOTH styles:
    // - { success:true, data:[...], count:n }
    // - { ok:true, items:[...], count:n }
    const list: any[] =
      (Array.isArray(raw?.items) && raw.items) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw?.data?.items) && raw.data.items) ||
      (Array.isArray(raw?.data?.categories) && raw.data.categories) ||
      (Array.isArray(raw?.categories) && raw.categories) ||
      (Array.isArray(raw) && raw) ||
      [];

    const categories = list
      .map((c: any) => {
        const id = String(c?._id ?? c?.id ?? "");
        const name = String(c?.name ?? "");
        if (!id || !name) return null;

        return {
          id,
          _id: id,
          name,
          slug: String(c?.slug ?? slugify(name)),
          active: typeof c?.active === "boolean" ? c.active : true,
          order: typeof c?.order === "number" ? c.order : 0,
          providerId: c?.providerId ?? c?.provider_id ?? null,
          createdAt: c?.createdAt,
          updatedAt: c?.updatedAt,
        };
      })
      .filter(Boolean)
      .filter((c: any) => (onlyActive ? c.active : true));

    return NextResponse.json(
      {
        ok: true,
        items: categories,
        count: categories.length,
        // remove later:
        _debug: { base, hasAuth, upstreamSuccess: raw?.success, upstreamOk: raw?.ok },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("GET /api/provider/categories error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch provider categories" },
      { status: e?.status ?? 500 }
    );
  }
}
