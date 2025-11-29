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

// GET /api/provider/addons/:id  → backend /api/addons/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/addons/${params.id}`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/addons/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to fetch addon" },
      { status: e?.status ?? 500 }
    );
  }
}

// PATCH /api/provider/addons/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/addons/${params.id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/addons/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to update addon" },
      { status: e?.status ?? 500 }
    );
  }
}

// DELETE /api/provider/addons/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headers = await authHeaders();

    const out = await serverFetch<any>(`${base()}/api/addons/${params.id}`, {
      method: "DELETE",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/addons/[id] error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Failed to delete addon" },
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
