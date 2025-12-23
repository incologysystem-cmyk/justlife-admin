// app/api/admin/services/route.ts
// ✅ service basePrice ALWAYS 0
// ✅ variants ALWAYS include: absolutePrice + durationMin + tags

import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverFetch";
import { cookies as getCookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Method not allowed. Use POST." },
    { status: 405 }
  );
}

function toNum(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normTags(v: any): string[] {
  const tags = Array.isArray(v) ? v : [];
  const out = tags.map((t) => String(t ?? "").trim()).filter(Boolean);
  return out.length ? out : ["default"];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, message: "Invalid JSON" },
        { status: 400 }
      );
    }

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
      "Content-Type": "application/json",
    };

    if (cookieHeader) (headers as any).Cookie = cookieHeader;
    if (incomingAuth) headers["Authorization"] = incomingAuth;
    else if (token) headers["Authorization"] = `Bearer ${token}`;
    if (apiKey) headers[apiKeyName] = apiKey;

    const p = body as any;

    // ✅ VARIANTS normalize (absolutePrice must be present)
    const variants = Array.isArray(p.variants)
      ? p.variants.map((v: any) => {
          const abs =
            v?.absolutePrice != null
              ? toNum(v.absolutePrice, NaN)
              : v?.unitPrice != null
              ? toNum(v.unitPrice, NaN)
              : v?.price != null
              ? toNum(v.price, NaN)
              : NaN;

          return {
            name: String(v?.name ?? "").trim(),

            // ✅ required by backend
            absolutePrice: toNum(abs, 0),

            // optional fields
            compareAtPrice:
              v?.compareAtPrice != null ? toNum(v.compareAtPrice, 0) : undefined,

            // ✅ duration variant based
            durationMin: v?.durationMin != null ? toNum(v.durationMin, 60) : 60,
            durationDelta: v?.durationDelta != null ? toNum(v.durationDelta, 0) : 0,

            // ✅ tags required
            tags: normTags(v?.tags),

            code: v?.code ? String(v.code).trim() : undefined,
            description: v?.description ? String(v.description).trim() : undefined,
            image: v?.image ? String(v.image).trim() : undefined,
            segment: v?.segment ?? undefined,
            defaultSelected: !!v?.defaultSelected,
            isPopular: !!v?.isPopular,
          };
        })
      : [];

    const backendPayload = {
      // core
      name: p.name,
      slug: p.slug,
      skuCode: p.skuCode,
      categoryId: p.categoryId,
      description: p.description ?? "",

      bookingType: p.bookingType ?? "HOURLY",
      quantityUnit: p.quantityUnit ?? "hours",

      // ✅ SERVICE PRICE REMOVED
      basePrice: 0,

      teamSize: p.teamSize ?? 1,
      minQty: p.minQty ?? 1,
      maxQty: p.maxQty ?? null,

      leadTimeMin: p.leadTimeMin ?? 0,
      bufferAfterMin: p.bufferAfterMin ?? 0,

      minProfessionals: p.minProfessionals ?? 1,
      maxProfessionals: p.maxProfessionals ?? 4,

      materialsAddonPrice: p.materialsAddonPrice ?? 0,

      promoCode: p.promoCode ?? null,
      promoPercent: p.promoPercent ?? 0,
      taxClass: p.taxClass ?? "standard",

      isInstantBookable: p.isInstantBookable !== false,
      requiresAddress: p.requiresAddress !== false,
      requiresSlot: p.requiresSlot !== false,

      images: Array.isArray(p.images) ? p.images : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      cities: Array.isArray(p.cities) ? p.cities : [],

      // ✅ normalized variants
      variants,

      addonIds: Array.isArray(p.addonIds) ? p.addonIds : [],
      addons: Array.isArray(p.addons) ? p.addons : [],
      priceMatrix: Array.isArray(p.priceMatrix) ? p.priceMatrix : [],

      formTemplateId: p.formTemplateId ?? undefined,
      formQuestions: Array.isArray(p.formQuestions) ? p.formQuestions : [],

      policy: p.policy ?? {
        cancellationHours: 0,
        rescheduleHours: 0,
        sameDayCutoffMin: 0,
      },

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
