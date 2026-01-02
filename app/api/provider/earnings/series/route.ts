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

export async function GET(req: NextRequest) {
  try {
    const headers = await authHeaders();

    const qs = req.nextUrl.search || ""; // ✅ forward ?days=30 etc.

    const out = await serverFetch<any>(`${base()}/api/bookings/analytics/earnings/series${qs}`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/earnings/series error:", e?.message);
    console.dir(e?.body, { depth: 20 });

    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to fetch earnings series",
        details: e?.body ?? null,
      },
      { status: e?.status ?? 500 }
    );
  }
}
