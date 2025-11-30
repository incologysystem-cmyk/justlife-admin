// src/app/api/provider/promocodes/route.ts
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

// 🔹 GET /api/provider/promocodes  → backend GET {{baseUrl}}/api/promo
export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.search || "";
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/promo${qs}`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    // backend se jo bhi aya (expect: { success, promocodes, ... })
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/promocodes error:", e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Failed to fetch promocodes",
      },
      { status: e?.status ?? 500 }
    );
  }
}

// 🔹 POST /api/provider/promocodes  → backend POST {{baseUrl}}/api/promo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/promo`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/provider/promocodes error:", e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Failed to create promocode",
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
