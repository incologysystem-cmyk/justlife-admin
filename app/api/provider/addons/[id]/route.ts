// app/api/provider/addons/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/serverFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function base() {
  const b =
    process.env.API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (!b) throw new Error("API_BASE (or NEXT_PUBLIC_API_BASE) is not set");
  return b;
}

async function authHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("accessToken")?.value ||
    cookieStore.get("token")?.value ||
    null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function compact<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const k of Object.keys(obj)) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function normalizePatch(input: any) {
  const raw = input ?? {};
  const priceRaw = raw.price ?? raw.perUnitPrice ?? raw.per_unit_price;
  const priceNum = priceRaw !== undefined ? Number(priceRaw) : undefined;

  return compact({
    title: typeof raw.title === "string" ? raw.title.trim() : undefined,
    name: typeof raw.name === "string" ? raw.name.trim() : undefined,
    description:
      typeof raw.description === "string" ? raw.description.trim() : undefined,
    summary: typeof raw.summary === "string" ? raw.summary.trim() : undefined,
    included: Array.isArray(raw.included) ? raw.included : undefined,
    excluded: Array.isArray(raw.excluded) ? raw.excluded : undefined,
    safetyNotice:
      typeof raw.safetyNotice === "string" ? raw.safetyNotice.trim() : undefined,
    learnMore:
      typeof raw.learnMore === "string"
        ? raw.learnMore
        : typeof raw.details === "string"
        ? raw.details
        : undefined,
    price: Number.isFinite(priceNum as number) ? (priceNum as number) : undefined,
    perUnitPrice: Number.isFinite(priceNum as number) ? (priceNum as number) : undefined,
    categoryId:
      raw.categoryId ?? raw.category_id ?? raw.category?.id ?? raw.category?._id
        ? String(raw.categoryId ?? raw.category_id ?? raw.category?.id ?? raw.category?._id)
        : undefined,
    imageBase64: typeof raw.imageBase64 === "string" ? raw.imageBase64 : undefined,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : undefined,
  });
}

// GET /api/provider/addons/:id  → backend /api/addons/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/addons/${params.id}`, {
      method: "GET",
      headers: { ...headers, Accept: "application/json" },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/provider/addons/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch addon", error: e?.body ?? undefined },
      { status: e?.status ?? 500 }
    );
  }
}

// PATCH /api/provider/addons/:id → backend PATCH /api/addons/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const headers = await authHeaders();

    const normalized = normalizePatch(body);

    const out = await serverFetch<any>(`${base()}/api/addons/${params.id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(normalized),
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/provider/addons/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to update addon", error: e?.body ?? undefined },
      { status: e?.status ?? 500 }
    );
  }
}

// DELETE /api/provider/addons/:id → backend DELETE /api/addons/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/addons/${params.id}`, {
      method: "DELETE",
      headers: { ...headers, Accept: "application/json" },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/provider/addons/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to delete addon", error: e?.body ?? undefined },
      { status: e?.status ?? 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
export async function HEAD() {
  return NextResponse.json({ ok: true });
}
