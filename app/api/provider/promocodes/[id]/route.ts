// src/app/api/provider/promocodes/[id]/route.ts
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

// ✅ GET /api/provider/promocodes/[id] → backend GET /api/promo/:id
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // ⬅️ yahan await important hai

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Promocode id is required" },
        { status: 400 }
      );
    }

    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/promo/${id}`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/promocodes/[id] error:", e);
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to fetch promocode",
      },
      { status: e?.status ?? 500 }
    );
  }
}

// ✅ PATCH /api/provider/promocodes/[id] → backend PATCH /api/promo/:id
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // ⬅️ yahan bhi await

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Promocode id is required" },
        { status: 400 }
      );
    }

    const headers = await authHeaders();
    const payload = await req.json();

    const out = await serverFetch<any>(`${base()}/api/promo/${id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/provider/promocodes/[id] error:", e);
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to update promocode",
      },
      { status: e?.status ?? 500 }
    );
  }
}

// ✅ DELETE /api/provider/promocodes/[id] → backend DELETE /api/promo/:id
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // ⬅️ yahan bhi await

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Promocode id is required" },
        { status: 400 }
      );
    }

    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/promo/${id}`, {
      method: "DELETE",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out ?? { ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/provider/promocodes/[id] error:", e);
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to delete promocode",
      },
      { status: e?.status ?? 500 }
    );
  }
}
