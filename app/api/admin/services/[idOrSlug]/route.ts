// app/api/admin/services/[idOrSlug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";
import { cookies as getCookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
export async function HEAD() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

// NOTE: yahan params Promise hai → Promise type use karo & await karo
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await context.params;

    // Agar id missing/undefined ho toh backend ko hit hi mat karo
    if (!idOrSlug || idOrSlug === "undefined" || idOrSlug === "null") {
      return NextResponse.json(
        { ok: false, message: "Missing service idOrSlug" },
        { status: 400 }
      );
    }

    // 🔐 cookies + token
    const store = await getCookies();
    const cookieHeader = store
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const token = store.get("token")?.value;
    const incomingAuth =
      req.headers.get("authorization") || req.headers.get("Authorization");

    const apiKeyName = process.env.API_KEY_HEADER || "x-api-key";
    const apiKey = process.env.API_KEY;

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (cookieHeader) {
      (headers as any).Cookie = cookieHeader;
    }

    if (incomingAuth) {
      headers["Authorization"] = incomingAuth;
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (apiKey) {
      headers[apiKeyName] = apiKey;
    }

    // ✅ Correct Express endpoint:
    //  GET /api/services/admin/services/:idOrSlug
    const out = await serverFetch<any>(
      `/api/services/admin/services/${encodeURIComponent(idOrSlug)}`,
      {
        method: "GET",
        headers,
      }
    );

    const svc =
      out?.data?.service ??
      out?.service ??
      out?.data ??
      out;

    if (!svc) {
      return NextResponse.json(
        { ok: false, message: "Service not found" },
        { status: 404 }
      );
    }

    // Frontend ka fetchService plain service expect karta hai
    return NextResponse.json(svc, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/services/[idOrSlug] error:", e);
    const msg = e?.body?.message || e?.message || "Failed";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
