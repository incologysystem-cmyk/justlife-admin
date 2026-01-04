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
    cookieStore.get("cm_admin_token")?.value ||
    null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * GET /api/provider/transactions/:id
 * proxies -> GET {API_BASE}/api/bookings/analytics/transactions/:id
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ✅ Next.js 15: params is Promise
) {
  try {
    const { id } = await ctx.params;

    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/bookings/analytics/transactions/${id}`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/transactions/[id] error:", e?.message);
    console.dir(e?.body, { depth: 20 });

    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to fetch transaction",
        details: e?.body ?? null,
      },
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
