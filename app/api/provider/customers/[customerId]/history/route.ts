// app/api/provider/customers/[customerId]/history/route.ts
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
    undefined;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/provider/customers/:customerId/history
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await ctx.params;
    const id = (customerId || "").trim();

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { ok: false, message: "Missing customerId" },
        { status: 400 }
      );
    }

    const headers = await authHeaders();

    const out = await serverFetch<any>(
      `${base()}/api/providers/customers/${encodeURIComponent(id)}/history`,
      {
        method: "GET",
        headers: { ...headers, Accept: "application/json" },
      }
    );

    const payload = out?.data ?? out ?? {};

    return NextResponse.json({ ok: true, data: payload }, { status: 200 });
  } catch (e: any) {
    console.error(
      "GET /api/provider/customers/[customerId]/history error:",
      e
    );
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch customer history" },
      { status: e?.status ?? 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function HEAD() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
