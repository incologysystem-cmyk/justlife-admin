import { NextRequest, NextResponse } from "next/server";

function getApiBase() {
  const base = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;
  if (!base) {
    console.warn("[provider-by-id] API_BASE missing");
  }
  return base;
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(name + "="));
  if (!match) return null;
  return match.split("=").slice(1).join("="); // token=abc.def.ghi
}

// GET /api/admin/providers/[id]
export async function GET(
  req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const API_BASE = getApiBase();
    if (!API_BASE) {
      return NextResponse.json(
        { error: "Server configuration error: API_BASE missing" },
        { status: 500 }
      );
    }

    // 🔧 yahan change: params ko await kiya
    const { id } = await Promise.resolve((context as any).params);

    const targetUrl = `${API_BASE.replace(
      /\/+$/,
      ""
    )}/api/admin/providers/${id}`;

    const cookieHeader = req.headers.get("cookie") || "";

    // JWT from cookie: first try token, then cm_admin_token
    const jwt =
      getCookieValue(cookieHeader, "token") ||
      getCookieValue(cookieHeader, "cm_admin_token");

    const adminApiKey = process.env.ADMIN_API_KEY;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    };

    if (jwt) {
      headers["authorization"] = `Bearer ${jwt}`;
    }

    if (adminApiKey) {
      headers["x-admin-api-key"] = adminApiKey;
    }

    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error("[provider-by-id] error", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
