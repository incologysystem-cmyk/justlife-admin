// src/app/api/provider/providerlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// same helper as addons route
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

  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (process.env.ADMIN_API_KEY) {
    headers["x-admin-api-key"] = process.env.ADMIN_API_KEY;
  }

  return headers;
}

// 🔹 GET /api/provider/providerlist  (Next)
//     → backend GET `${base()}/api/admin/providers?status=...`
export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.search || ""; // ?status=pending etc.
    const headers = await authHeaders();

    const url = `${base()}/api/admin/providers${qs}`;
    console.log("[proxy] GET", url);

    const out = await serverFetch<any>(url, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    // backend: { success, providers, ... }
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/providerlist error:", e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Failed to fetch providers list",
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
