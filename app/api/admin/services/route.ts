import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";
import { cookies as getCookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed. Use POST." }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
    }

    const store = await getCookies();
    const cookieHeader = store.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    const token = store.get("token")?.value;
    const bearer = token ? `Bearer ${token}` : undefined;
    const incomingAuth = req.headers.get("authorization") || req.headers.get("Authorization");
    const apiKeyName = process.env.API_KEY_HEADER || "x-api-key";
    const apiKey = process.env.API_KEY;

    const headers: HeadersInit = { Accept: "application/json", "Content-Type": "application/json" };
    if (cookieHeader) (headers as any).Cookie = cookieHeader;
    if (incomingAuth) headers["Authorization"] = incomingAuth;
    else if (bearer) headers["Authorization"] = bearer;
    if (apiKey) headers[apiKeyName] = apiKey;

    const p = body as any;

    const backendPayload = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku_code: p.skuCode,
      category_id: p.categoryId,
      base_price: p.basePrice,
      duration_min: p.durationMin,
      team_size: p.teamSize,
      min_qty: p.minQty,
      max_qty: p.maxQty ?? null,
      lead_time_min: p.leadTimeMin,
      buffer_after_min: p.bufferAfterMin,
      tax_class: p.taxClass,
      is_instant_bookable: p.isInstantBookable,
      requires_address: p.requiresAddress,
      requires_slot: p.requiresSlot,
      images: Array.isArray(p.images) ? p.images : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      cities: Array.isArray(p.cities) ? p.cities : [],
      variants: Array.isArray(p.variants) ? p.variants : [],
      addons: Array.isArray(p.addons) ? p.addons : [],
      price_matrix: Array.isArray(p.priceMatrix) ? p.priceMatrix : [],
      form_questions: Array.isArray(p.formQuestions) ? p.formQuestions : [],
      policy: p.policy ?? { cancellationHours: 0, rescheduleHours: 0, sameDayCutoffMin: 0 },
      active: p.active === false ? false : true,
      status: p.status || "draft",
    };

    const out = await serverFetch("/api/services/admin/services", {
      method: "POST",
      headers,
      body: JSON.stringify(backendPayload),
    });

    return NextResponse.json(out ?? { ok: true });
  } catch (e: any) {
    const msg = e?.body?.message || e?.message || "Failed";
    console.error("POST /api/admin/services error:", e);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
