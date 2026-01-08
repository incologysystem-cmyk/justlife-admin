import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "http://localhost:5000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ idOrSlug: string }> } // ✅ params is Promise
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { idOrSlug } = await ctx.params; // ✅ unwrap params
    if (!idOrSlug) {
      return NextResponse.json(
        { ok: false, message: "Missing idOrSlug" },
        { status: 400 }
      );
    }

    // ✅ backend endpoint (single service)
    const backendUrl = `${BACKEND_BASE}/api/services/admin/services/${encodeURIComponent(
      idOrSlug
    )}`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await backendRes.text().catch(() => "");
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    return NextResponse.json(json, { status: backendRes.status });
  } catch (e: any) {
    console.error("[NEXT] /api/admin/servicesRequest/[idOrSlug] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch service" },
      { status: 500 }
    );
  }
}
