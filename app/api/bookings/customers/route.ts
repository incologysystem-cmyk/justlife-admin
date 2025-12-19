// app/api/bookings/customers/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export async function GET(req: NextRequest) {
  try {
    // ✅ yahan se direct cookie lo (no next/headers, no cookies())
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔁 AB YAHAN NEW BACKEND ENDPOINT
    const backendUrl = `${BACKEND_BASE}/api/users/customers`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
    console.error("[NEXT] /api/bookings/customers error:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
