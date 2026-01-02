import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;

export async function GET(req: Request) {
  const r = await fetch(`${API_BASE}/api/provider/me`, {
    headers: { cookie: req.headers.get("cookie") || "" },
    cache: "no-store",
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status, headers: { "Content-Type": "application/json" } });
}

export async function PATCH(req: Request) {
  const body = await req.text();

  const r = await fetch(`${API_BASE}/api/provider/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    body,
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status, headers: { "Content-Type": "application/json" } });
}
