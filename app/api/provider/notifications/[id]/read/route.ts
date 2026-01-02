// src/app/api/provider/notifications/[id]/read/route.ts
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

function normalizeId(v: any) {
  const id = String(v ?? "").trim();
  if (!id || id === "undefined" || id === "null") return "";
  return id;
}

// ✅ IMPORTANT: params is a Promise in newer Next.js
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raw } = await ctx.params;
    const id = normalizeId(raw);

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Missing notification id" },
        { status: 400 }
      );
    }

    const headers = await authHeaders();

    const out = await serverFetch<any>(
      `${base()}/api/notifications/${encodeURIComponent(id)}/read`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Accept: "application/json",
        },
      }
    );

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/provider/notifications/[id]/read error:", e?.message);
    console.dir(e?.body, { depth: 20 });

    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to mark notification read",
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
