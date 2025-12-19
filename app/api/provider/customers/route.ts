// app/api/provider/customers/route.ts
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

// GET /api/provider/customers -> forwards to backend /api/providers/customers
export async function GET(_req: NextRequest) {
  try {
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/providers/customers`, {
      method: "GET",
      headers: { ...headers, Accept: "application/json" },
    });

    const items: any[] =
      Array.isArray(out?.items) ? out.items :
      Array.isArray(out?.data?.items) ? out.data.items :
      [];

    return NextResponse.json({ ok: true, data: { items } }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/customers error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch provider customers" },
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
