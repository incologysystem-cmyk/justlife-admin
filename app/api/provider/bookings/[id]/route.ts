// app/api/provider/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isHex24 = (s: string) => /^[0-9a-fA-F]{24}$/.test(s);

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

// GET /api/provider/bookings/:id  →  backend /api/bookings/:id
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raw } = await ctx.params;
    const id = (raw || "").trim();

    if (!isHex24(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid booking id" },
        { status: 400 }
      );
    }

    const headers = await authHeaders();

    const out = await serverFetch<any>(
      `${base()}/api/bookings/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: { ...headers, Accept: "application/json" },
      }
    );

    const booking = out?.data?.booking ?? out?.booking ?? out;

    return NextResponse.json(
      { ok: true, data: { booking } },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("GET /api/provider/bookings/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch provider booking" },
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
