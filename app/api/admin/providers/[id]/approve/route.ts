import { NextRequest, NextResponse } from "next/server";

function getApiBase() {
  const base = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;
  if (!base) {
    console.warn("[provider-approve] API_BASE missing");
  }
  return base;
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(name + "="));
  if (!match) return null;
  return match.split("=").slice(1).join("=");
}

// PATCH /api/admin/providers/[id]/approve
export async function PATCH(
  req: NextRequest,
  context:
    | { params: { id: string } }
    | { params: Promise<{ id: string }> }
) {
  try {
    const API_BASE = getApiBase();
    if (!API_BASE) {
      return NextResponse.json(
        { error: "Server configuration error: API_BASE missing" },
        { status: 500 }
      );
    }

    const { id } = await Promise.resolve((context as any).params);

    const targetUrl = `${API_BASE.replace(
      /\/+$/,
      ""
    )}/api/admin/providers/${id}/approve`;

    const cookieHeader = req.headers.get("cookie") || "";

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

    const bodyJson = await req.json().catch(() => ({} as any));

    const res = await fetch(targetUrl, {
      method: "PATCH",          // 👈 IMPORTANT
      headers,
      body: JSON.stringify(bodyJson),
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
    console.error("[provider-approve] error", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
