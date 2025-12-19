// admin/app/api/provider/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Runtime pe ENV se base URL lo
 */
function getApiBase() {
  const base = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;
  if (!base) {
    console.warn("[provider proxy] API_BASE / NEXT_PUBLIC_API_BASE is not set");
  }
  return base;
}

// Helper to forward to backend
async function forwardToBackend(req: NextRequest, method: string) {
  const API_BASE = getApiBase();

  if (!API_BASE) {
    return NextResponse.json(
      { error: "Server configuration error: API_BASE missing" },
      { status: 500 }
    );
  }

  // frontend:  POST /api/provider
  // proxy ->   POST http://localhost:5000/api/providers
  const targetUrl = `${API_BASE.replace(/\/+$/, "")}/api/providers`;

  let body: any = undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await req.json();
    } catch {
      body = undefined;
    }
  }

  const res = await fetch(targetUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
      authorization: req.headers.get("authorization") || "",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return NextResponse.json(json, { status: res.status });
}

export async function POST(req: NextRequest) {
  try {
    return await forwardToBackend(req, "POST");
  } catch (err: any) {
    console.error("[provider proxy] POST error", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
