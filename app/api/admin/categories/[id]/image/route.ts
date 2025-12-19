// app/api/admin/categories/[id]/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<string> {
  const p: any = (ctx as any)?.params;
  if (!p) return "";
  if (typeof p.then === "function") {
    const r = await p;
    return String(r?.id ?? "");
  }
  return String(p?.id ?? "");
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const id = (await getId(ctx)).trim();

    const BASE =
      process.env.API_BASE?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");

    if (!BASE) {
      return NextResponse.json(
        { ok: false, message: "API_BASE not set" },
        { status: 500 }
      );
    }

    if (!id || id === "undefined") {
      console.error("❌ [NEXT] image route missing id:", { id });
      return NextResponse.json(
        { ok: false, message: "Missing category id in route params" },
        { status: 400 }
      );
    }

    const token = req.cookies.get("token")?.value;
    const authHeaders: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const form = await req.formData();

    console.log("🟦 [NEXT] upload image route hit:", { id });
    console.log("🟦 [NEXT] form keys:", Array.from(form.keys()));

    const resp = await serverFetch<any>(
      `${BASE}/api/category/admin/categories/${id}/image`,
      {
        method: "POST",
        headers: {
          ...authHeaders,
          // DO NOT set Content-Type for FormData
        },
        body: form,
      }
    );

    console.log("🟩 [NEXT] Express image upload response:", resp);

    return NextResponse.json(resp, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/admin/categories/[id]/image error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed" },
      { status: e?.status || 500 }
    );
  }
}
