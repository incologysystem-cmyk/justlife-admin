// src/app/api/provider/notifications/read-all/route.ts
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
    null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function POST(req: NextRequest) {
  try {
    const headers = await authHeaders();

    // ✅ enforce audience=PROVIDER in proxy
    const upstream = new URL(`${base()}/api/notifications/read-all`);
    upstream.searchParams.set("audience", "PROVIDER");

    const out = await serverFetch<any>(upstream.toString(), {
      method: "POST",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/provider/notifications/read-all error:", e?.message);
    console.dir(e?.body, { depth: 20 });

    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to mark all notifications read",
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
