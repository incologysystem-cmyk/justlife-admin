// app/api/provider/addons/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn(
    "⚠️ NEXT_PUBLIC_BACKEND_URL is not set. Add it to your .env.local file."
  );
}

function backendUrl(path: string) {
  // e.g. http://localhost:4000/api/provider/addons
  return `${BACKEND_URL?.replace(/\/$/, "")}/api/provider/addons${path}`;
}

// GET /api/provider/addons  → proxy to backend GET /api/provider/addons
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.toString();
    const url = backendUrl(query ? `?${query}` : "");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: req.headers.get("authorization") || "",
      },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[NEXT] /api/provider/addons GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch addons" },
      { status: 500 }
    );
  }
}

// POST /api/provider/addons → proxy to backend POST /api/provider/addons
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(backendUrl(""), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[NEXT] /api/provider/addons POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create addon" },
      { status: 500 }
    );
  }
}
