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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ⬇️ yahan error aa raha tha – ab params ko await kar rahe hain
    const { id } = await params;

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
