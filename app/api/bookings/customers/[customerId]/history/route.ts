// app/api/bookings/customers/[customerId]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

type ParamsPromise = Promise<{ customerId: string }>;

export async function GET(
  _req: NextRequest,
  ctx: { params: ParamsPromise }
) {
  try {
    const { customerId } = await ctx.params; // ⬅️ async params

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const adminToken =
      cookieStore.get("cm_admin_token")?.value ??
      cookieStore.get("accessToken")?.value ??
      cookieStore.get("token")?.value ??
      null;

    if (!adminToken && !ADMIN_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔁 AB YAHAN NEW BACKEND ENDPOINT
    const backendUrl = `${BACKEND_BASE}/api/users/customers/${encodeURIComponent(
      customerId
    )}/history`;

    console.log(
      "[NEXT] proxy ->",
      backendUrl,
      "auth=",
      !!adminToken,
      "apiKey=",
      !!ADMIN_API_KEY
    );

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...(ADMIN_API_KEY ? { "x-admin-api-key": ADMIN_API_KEY } : {}),
      },
      cache: "no-store",
    });

    const text = await res.text().catch(() => "");
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    console.log(
      "[NEXT] /api/bookings/customers/[customerId]/history backend:",
      res.status,
      text
    );

    return NextResponse.json(json, { status: res.status });
  } catch (err: any) {
    console.error(
      "[NEXT] /api/bookings/customers/[customerId]/history error:",
      err
    );
    return NextResponse.json(
      { error: err?.message || "Failed to load customer history" },
      { status: 500 }
    );
  }
}
