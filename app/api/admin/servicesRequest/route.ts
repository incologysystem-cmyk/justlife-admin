import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || "http://localhost:5000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // ✅ default draft
    if (!searchParams.has("status")) searchParams.set("status", "draft");

    const qs = searchParams.toString();

    // ✅ backend endpoint
    const backendUrl = `${BACKEND_BASE}/api/services/admin/services${qs ? `?${qs}` : ""}`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ SAME AS YOUR CUSTOMERS ROUTE
      },
    });

    const text = await backendRes.text().catch(() => "");
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    // ✅ return exact backend status
    return NextResponse.json(json, { status: backendRes.status });
  } catch (e: any) {
    console.error("[NEXT] /api/admin/servicesRequest error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}
